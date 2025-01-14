const Creature = require('../models/creature'); // Importa o modelo Creature
const { Op } = require('sequelize'); // Importa operadores do Sequelize para consultas

// Função auxiliar para determinar o tipo MIME de dados binários de imagem
const getMimeType = (imgBuffer) => {
    if (!imgBuffer || imgBuffer.length < 12) return null; // Verifica se o buffer é válido e suficientemente longo
    const riffHeader = imgBuffer.slice(0, 4).toString('hex'); // Verifica a assinatura RIFF
    const webpHeader = imgBuffer.slice(8, 12).toString('ascii'); // Verifica o identificador WEBP

    if (riffHeader === '52494646' && webpHeader === 'WEBP') {
        return 'image/webp'; // Retorna WEBP
    }

    const signature = imgBuffer.slice(0, 4).toString('hex');
    switch (signature) {
        case '89504e47': return 'image/png'; // Retorna PNG
        case 'ffd8ffe0': 
        case 'ffd8ffe1': 
        case 'ffd8ffe2': 
        case 'ffd8ffe3': 
        case 'ffd8ffe8': return 'image/jpeg'; // Retorna JPEG
        case '47494638': return 'image/gif'; // Retorna GIF
        case '49492a00': 
        case '4d4d002a': return 'image/tiff'; // Retorna TIFF
        default: return 'application/octet-stream'; // Retorna tipo desconhecido
    }
};

// Controlador para buscar todas as criaturas com filtros opcionais
exports.getAllCreatures = async (req, res) => {
    const { name, latest, page = 1, limit = 10 } = req.query; // Extrai parâmetros de consulta

    try {
        const where = {}; // Define um objeto de filtro para condições de consulta
        if (name) where.Name = { [Op.like]: `%${name}%` }; // Filtra criaturas pelo nome
        if (latest) where.CreatedOn = { [Op.lt]: latest }; // Filtra criaturas criadas antes de uma data específica

        // Consulta a base de dados para obter criaturas e contar os resultados
        const { rows, count } = await Creature.findAndCountAll({
            where, // Aplica os filtros
            attributes: ['Id', 'Name', 'Img', 'Lore'], // Seleciona campos específicos
            limit: parseInt(limit, 10), // Limita o número de resultados por página
            offset: (parseInt(page, 10) - 1) * parseInt(limit, 10), // Calcula o deslocamento para paginação
        });

        // Transforma as criaturas para incluir imagens codificadas em Base64
        const transformedCreatures = rows.map(creature => {
            const mimeType = creature.Img ? getMimeType(creature.Img) : null;
            return {
                Id: creature.Id,
                Name: creature.Name,
                Img: creature.Img
                    ? `data:${mimeType};base64,${creature.Img.toString('base64')}` // Codifica Buffer para Base64 com MIME
                    : null,
                Lore: creature.Lore,
            };
        });

        // Conta o número total de criaturas na base de dados (ignorando a paginação)
        const totalCreatures = await Creature.count({ where });

        // Responde com os dados transformados, contagem total e contagem filtrada
        res.status(200).json({
            data: transformedCreatures,
            filteredCount: count, // Contagem após filtros
            totalCount: totalCreatures, // Contagem total na base de dados
        });
    } catch (error) {
        console.error('Erro ao buscar criaturas:', error);
        res.status(500).json({ error: 'Falha ao buscar criaturas. Por favor, tente novamente.' });
    }
};

// Controlador para adicionar uma nova criatura
exports.addCreature = async (req, res) => {
    const { Name, Lore, Img } = req.body; // Extrai os dados do corpo da requisição

    const CreatedBy = req.userId; // Obtém o ID do utilizador autenticado

    console.log(Img);

    try {
        // Verifica se já existe uma criatura com o mesmo nome
        const existingCreature = await Creature.findOne({ where: { Name } });
        if (existingCreature) {
            return res.status(400).json({ error: 'Uma criatura com este nome já existe.' });
        }

        // Decodifica a imagem em Base64, se fornecida
        let buffer = null;
        if (Img) {
            const base64Data = Img.split(',')[1]; // Remove o prefixo "data:image/jpeg;base64,"
            buffer = Buffer.from(base64Data, 'base64'); // Converte para buffer binário
        }

        // Inicia uma transação para garantir atomicidade
        const result = await Creature.sequelize.transaction(async (transaction) => {
            // Salva a nova criatura na base de dados dentro da transação
            const newCreature = await Creature.create(
                {
                    Name,
                    Lore,
                    Img: buffer, // Salva os dados binários no campo MEDIUMBLOB
                    CreatedBy,
                },
                { transaction }
            );
            return newCreature;
        });

        // Responde com a criatura criada
        res.status(201).json(result);
    } catch (error) {
        console.error('Erro ao adicionar criatura:', error);

        // Trata erros conhecidos
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ error: 'O nome da criatura deve ser único.' });
        } else {
            res.status(500).json({ error: 'Falha ao adicionar criatura.' });
        }
    }
};

// Controlador para atualizar os detalhes de uma criatura
exports.editCreature = async (req, res) => {
    const { Name, Lore, Img } = req.body; // Extrai os dados atualizados do corpo da requisição
    console.log(req.params.id);

    try {
        console.log("Tipo MIME recebido:", req.body.Img.split(";")[0]);

        // Decodifica a imagem em Base64, se fornecida
        let buffer = null;
        if (Img) {
            const base64Data = Img.split(',')[1]; // Remove o prefixo "data:image/jpeg;base64,"
            buffer = Buffer.from(base64Data, 'base64'); // Converte para buffer binário
        }

        // Atualiza os detalhes da criatura na base de dados
        const updated = await Creature.update(
            { 
                Name, 
                Lore, 
                Img: buffer // Salva os dados binários no campo MEDIUMBLOB
            },
            { where: { Id: req.params.id } } // Identifica a criatura pelo ID fornecido nos parâmetros
        );

        if (!updated[0]) {
            return res.status(404).json({ error: 'Criatura não encontrada' }); // Retorna erro 404 se nenhuma linha for atualizada
        }

        res.status(200).json({ message: 'Criatura atualizada com sucesso' }); // Responde com mensagem de sucesso
    } catch (error) {
        console.error('Erro ao atualizar criatura:', error);
        res.status(500).json({ error: 'Falha ao atualizar criatura.' }); // Trata erros do servidor
    }
};

// Controlador para eliminar uma criatura pelo ID
exports.deleteCreature = async (req, res) => {
    try {
        const deleted = await Creature.destroy({ where: { Id: req.params.id } }); // Elimina o registo pelo ID
        if (!deleted) return res.status(404).json({ error: 'Criatura não encontrada' }); // Retorna erro 404 se nenhuma linha for eliminada
        res.status(200).json({ message: 'Criatura eliminada com sucesso' }); // Responde com mensagem de sucesso
    } catch (error) {
        res.status(500).json({ error: error.message }); // Trata erros do servidor
    }
};
