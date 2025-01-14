const Creature = require('../models/creature'); // Importa o modelo Creature para interagir com a base de dados
const UserFavourite = require('../models/userFavourite'); // Importa o modelo UserFavourite para gerir favoritos
const { Op } = require('sequelize'); // Importa os operadores do Sequelize para construir consultas avançadas

// Função auxiliar para determinar o tipo MIME de dados binários de uma imagem
const getMimeType = (imgBuffer) => {
    if (!imgBuffer || imgBuffer.length < 12) return null; // Verifica se o buffer é válido e contém pelo menos 12 bytes
    const riffHeader = imgBuffer.slice(0, 4).toString('hex'); // Obtém os primeiros 4 bytes para verificar a assinatura RIFF
    const webpHeader = imgBuffer.slice(8, 12).toString('ascii'); // Obtém bytes adicionais para verificar se a imagem é WEBP

    if (riffHeader === '52494646' && webpHeader === 'WEBP') {
        return 'image/webp'; // Retorna o tipo MIME para imagens WEBP
    }

    const signature = imgBuffer.slice(0, 4).toString('hex'); // Obtém a assinatura inicial da imagem para determinar o tipo MIME
    switch (signature) {
        case '89504e47': return 'image/png'; // Retorna o tipo MIME para imagens PNG
        case 'ffd8ffe0': // Assinatura para JPEG (variação 1)
        case 'ffd8ffe1': // Assinatura para JPEG (variação 2)
        case 'ffd8ffe2': // Assinatura para JPEG (variação 3)
        case 'ffd8ffe3': // Assinatura para JPEG (variação 4)
        case 'ffd8ffe8': return 'image/jpeg'; // Retorna o tipo MIME para imagens JPEG
        case '47494638': return 'image/gif'; // Retorna o tipo MIME para imagens GIF
        case '49492a00': // Assinatura para TIFF (Intel)
        case '4d4d002a': return 'image/tiff'; // Retorna o tipo MIME para imagens TIFF (Motorola)
        default: return 'application/octet-stream'; // Retorna um tipo MIME genérico para dados desconhecidos
    }
};

// Endpoint para obter todas as criaturas
exports.getAllCreatures = async (req, res) => {
    // Extrair os parâmetros de consulta da requisição, com valores padrão
    const { name, latest, page = 1, limit = 10, OnlyFavoriteArcanes = false, ToSaveOffline = false } = req.query;
    const userId = req.userId; // Assume que o ID do utilizador está disponível através do middleware de autenticação

    try {
        // Construir condições de filtro para a consulta
        const where = {};
        if (name && name.trim() !== "") {
            where.Name = { [Op.like]: `%${name}%` }; // Adiciona filtro para procurar por nome parcialmente
        }
        if (latest) {
            where.CreatedOn = { [Op.lt]: latest }; // Adiciona filtro para procurar por data de criação
        }

        // Verificar condições especiais para guardar offline
        if (ToSaveOffline === 'true') {
            // Ignorar favoritos e devolver apenas os primeiros 10 registos
            const monsters = await Creature.findAll({
                attributes: ['Id', 'Name', 'Img', 'Lore'], // Define os campos a serem procurados
                limit: 10, // Limita o número de resultados
            });

            // Transforma os registos para incluir imagens em Base64
            const transformedCreatures = monsters.map(creature => {
                const mimeType = creature.Img ? getMimeType(creature.Img) : null; // Determina o tipo MIME
                return {
                    Id: creature.Id,
                    Name: creature.Name,
                    Img: creature.Img
                        ? `data:${mimeType};base64,${creature.Img.toString('base64')}` // Converte a imagem para Base64
                        : null,
                    Lore: creature.Lore,
                    isFavoriteToUser: false, // Define que os registos não são favoritos neste caso
                };
            });

            return res.status(200).json({
                data: transformedCreatures, // Retorna os dados transformados
                count: transformedCreatures.length, // Retorna a quantidade de registos transformados
            });
        }

        let favoriteIds = [];
        if (OnlyFavoriteArcanes === 'true') {
            // Busca os favoritos do utilizador com sessão iniciada
            const favorites = await UserFavourite.findAll({
                where: { UserId: userId }, // Filtra pelos favoritos do utilizador
                attributes: ['CreatureId'], // Apenas o ID das criaturas favoritas
                raw: true, // Retorna os dados no formato bruto
            });
            favoriteIds = favorites.map(fav => fav.CreatureId); // Extrai os IDs das criaturas favoritas

            where.Id = { [Op.in]: favoriteIds }; // Filtra para procurar apenas os favoritos
        } else if (OnlyFavoriteArcanes === 'false') {
            // Devolve os IDs das criaturas não favoritas
            const favorites = await UserFavourite.findAll({
                where: { UserId: userId }, // Filtra pelos favoritos do utilizador
                attributes: ['CreatureId'], // Apenas o ID das criaturas favoritas
                raw: true, // Retorna os dados no formato bruto
            });
            favoriteIds = favorites.map(fav => fav.CreatureId); // Extrai os IDs das criaturas favoritas

            where.Id = { [Op.notIn]: favoriteIds }; // Filtra para procurar apenas os não favoritos
        }

        // Consulta à base de dados com paginação
        const { rows, count } = await Creature.findAndCountAll({
            where, // Aplica os filtros construídos
            attributes: ['Id', 'Name', 'Img', 'Lore'], // Define os campos a serem buscados
            limit: parseInt(limit, 10), // Limita o número de resultados por página
            offset: (parseInt(page, 10) - 1) * parseInt(limit, 10), // Define o deslocamento para a paginação
        });

        // Transforma os registos para incluir imagens em Base64
        const transformedCreatures = rows.map(creature => {
            const mimeType = creature.Img ? getMimeType(creature.Img) : null; // Determina o tipo MIME
            return {
                Id: creature.Id,
                Name: creature.Name,
                Img: creature.Img
                    ? `data:${mimeType};base64,${creature.Img.toString('base64')}` // Converte a imagem para Base64
                    : null,
                Lore: creature.Lore,
                isFavoriteToUser: favoriteIds.includes(creature.Id), // Verifica se a criatura é favorita
            };
        });

        return res.status(200).json({ data: transformedCreatures, count }); // Devolve os dados transformados e a contagem
    } catch (error) {
        console.error('Erro ao procurar criaturas:', error); // Escreve o erro no console para depuração
        return res.status(500).json({ error: 'Falha ao procurar criaturas. Por favor, tente novamente.' }); // Retorna erro genérico
    }
};

// Endpoint para buscar a imagem de fundo de uma criatura favorita do utilizador
exports.getCreatureDetails = async (req, res) => {
    try {
        console.log("A obter detalhes da criatura...");

        // Buscar os detalhes da criatura favorita do utilizador pelo ID da criatura e do utilizador
        const favorite = await UserFavourite.findOne({
            where: {
                CreatureId: req.params.id, // ID da criatura
                UserId: req.userId, // ID do utilizador (obtido pelo middleware)
            },
            attributes: ['BackgroundImg'], // Buscar apenas o campo BackgroundImg
        });

        // Verificar se a criatura favorita existe
        if (!favorite) {
            return res.status(404).json({ error: 'Favorito não encontrado para este utilizador e criatura.' });
        }

        let backgroundImgBase64 = null;

        // Se existir uma imagem de fundo, determinar o tipo MIME e converter para Base64
        if (favorite.BackgroundImg) {
            const mimeType = getMimeType(favorite.BackgroundImg);

            // Verificar se o formato da imagem é suportado
            if (!mimeType || mimeType === 'application/octet-stream') {
                console.log("Assinatura do Buffer:", favorite.BackgroundImg.slice(0, 4).toString('hex'));
                return res.status(400).json({ error: 'Formato de imagem não suportado.' });
            }

            backgroundImgBase64 = `data:${mimeType};base64,${favorite.BackgroundImg.toString('base64')}`;
            console.log("Tipo MIME detectado:", mimeType);
        }

        // Retornar a imagem de fundo em Base64
        res.status(200).json({
            BackgroundImg: backgroundImgBase64, // Imagem de fundo codificada com tipo MIME
        });
    } catch (error) {
        console.error('Erro ao buscar a imagem de fundo favorita:', error);
        res.status(500).json({ error: 'Falha ao buscar a imagem de fundo. Por favor, tente novamente.' });
    }
};

// Adicionar uma criatura aos favoritos do utilizador
exports.addCreatureToFavourites = async (req, res) => {
    try {
        const { CreatureId } = req.body; // Extrair o ID da criatura do corpo da requisição
        const newFavourite = await UserFavourite.create({
            CreatureId, // ID da criatura adicionada aos favoritos
            UserId: req.userId, // ID do utilizador (obtido pelo middleware)
            AddedBy: req.userId, // Quem adicionou o favorito (mesmo que o utilizador)
        });
        res.status(201).json(newFavourite); // Retornar o novo favorito criado
    } catch (error) {
        res.status(500).json({ error: error.message }); // Retornar erro do servidor
    }
};

// Remover uma criatura dos favoritos do utilizador
exports.removeCreatureFromFavourites = async (req, res) => {
    try {
        const deleted = await UserFavourite.destroy({
            where: { CreatureId: req.params.id, UserId: req.userId }, // Remover por ID e propriedade do utilizador
        });
        if (!deleted) return res.status(404).json({ error: 'Favorito não encontrado' }); // Se não encontrado, retornar 404
        res.status(200).json({ message: 'Favorito removido com sucesso' }); // Confirmar remoção bem-sucedida
    } catch (error) {
        res.status(500).json({ error: error.message }); // Retornar erro do servidor
    }
};

// Atualizar a imagem de fundo de uma criatura favorita
exports.changeFavouriteCreatureBackground = async (req, res) => {
    try {
        const { BackgroundImg } = req.body;

        // Verificar se a imagem de fundo foi fornecida
        if (!BackgroundImg) {
            return res.status(400).json({ error: 'BackgroundImg é obrigatório' });
        }

        // Decodificar a imagem Base64, se fornecida
        let buffer = null;
        if (BackgroundImg) {
            const base64Data = BackgroundImg.split(',')[1]; // Remover o prefixo "data:image/jpeg;base64,"
            buffer = Buffer.from(base64Data, 'base64'); // Converter para buffer binário
        }

        // Atualizar a imagem de fundo na base de dados
        const updated = await UserFavourite.update(
            { BackgroundImg: buffer }, // Salvar o buffer binário
            { where: { CreatureId: req.params.id, UserId: req.userId } } // Atualizar pelo ID da criatura e do utilizador
        );

        if (updated[0] === 0) {
            return res.status(404).json({ error: 'Favorito não encontrado' });
        }

        res.status(200).json({ message: 'Imagem de fundo atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar a imagem de fundo:', error);
        res.status(500).json({ error: 'Falha ao atualizar a imagem de fundo.' });
    }
};

// Redefinir a imagem de fundo de uma criatura favorita para o padrão
exports.changeFavouriteCreatureBackgroundToDefault = async (req, res) => {
    try {
        const reset = await UserFavourite.update(
            { BackgroundImg: null }, // Remover a imagem de fundo
            { where: { CreatureId: req.params.id, UserId: req.userId } } // Atualizar pelo ID da criatura e do utilizador
        );

        if (reset[0] === 0) {
            return res.status(404).json({ error: 'Favorito não encontrado' });
        }

        res.status(200).json({ message: 'Imagem de fundo redefinida para o padrão com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Falha ao redefinir a imagem de fundo.' });
    }
};

