const Creature = require('../models/creature'); // Import the Creature model
const UserFavourite = require('../models/userFavourite'); // Import the UserFavourite model
const { Op } = require('sequelize'); // Import Sequelize operators for querying

// Helper function to determine the MIME type of binary image data
const getMimeType = (imgBuffer) => {
    const signature = imgBuffer.slice(0, 4).toString('hex'); // Get the first few bytes as a hex signature
    switch (signature) {
        case '89504e47': return 'image/png'; // PNG
        case 'ffd8ffe0': case 'ffd8ffe1': case 'ffd8ffe2': return 'image/jpeg'; // JPEG
        case '47494638': return 'image/gif'; // GIF
        default: return 'application/octet-stream'; // Unknown or unsupported type
    }
};

// Endpoint para buscar todas as criaturas
exports.getAllCreatures = async (req, res) => {
    const { name, latest, page = 1, limit = 10 } = req.query;
    const userId = req.userId; // Assumindo que o userId vem do middleware de autenticação

    try {
        // Construir condições de filtro
        const where = {};
        if (name) {
            where.Name = { [Op.like]: `%${name}%` }; // Filtro parcial por nome
        }
        if (latest) {
            where.CreatedOn = { [Op.lt]: latest }; // Filtro por data de criação
        }

        // Consultar a tabela Creatures com filtros e paginação
        const { rows, count } = await Creature.findAndCountAll({
            where,
            attributes: ['Id', 'Name', 'Img', 'Lore'], // Selecionar campos específicos
            limit: parseInt(limit, 10), // Limite de registros por página
            offset: (parseInt(page, 10) - 1) * parseInt(limit, 10), // Calcular offset para paginação
        });

        // Obter IDs das criaturas
        const creatureIds = rows.map(creature => creature.Id);

        // Verificar favoritos do usuário
        const favorites = await UserFavourite.findAll({
            where: {
                UserId: userId,
                CreatureId: { [Op.in]: creatureIds },
            },
            attributes: ['CreatureId'],
        });

        // Criar um conjunto com os IDs das criaturas favoritas
        const favoriteSet = new Set(favorites.map(fav => fav.CreatureId));

        // Transformar os resultados para incluir o campo "isFavoriteToUser"
        const transformedCreatures = rows.map(creature => {
            const mimeType = creature.Img ? getMimeType(creature.Img) : null;
            return {
                Id: creature.Id,
                Name: creature.Name,
                Img: creature.Img
                    ? `data:${mimeType};base64,${creature.Img.toString('base64')}` // Converter Buffer para Base64 com MIME
                    : null,
                Lore: creature.Lore,
                isFavoriteToUser: favoriteSet.has(creature.Id), // Verificar se é favorito
            };
        });

        // Enviar resposta com dados e contagem total
        return res.status(200).json({
            data: transformedCreatures,
            count, // Número total de registros
        });
    } catch (error) {
        console.error('Erro ao buscar criaturas:', error); // Log de erro para debug
        return res.status(500).json({ error: 'Falha ao buscar criaturas. Por favor, tente novamente.' }); // Mensagem de erro amigável
    }
};

// Fetch detailed information for a single creature by ID
exports.getCreatureDetails = async (req, res) => {
    try {
        const creature = await Creature.findByPk(req.params.id, {
            attributes: ['Id', 'Name', 'Img', 'Lore'], // Select specific fields to return
        });
        if (!creature) return res.status(404).json({ error: 'Creature not found' }); // If not found, return 404
        res.status(200).json(creature); // Return the creature details
    } catch (error) {
        res.status(500).json({ error: error.message }); // Send server error response
    }
};

// Add a creature to the user's favourites
exports.addCreatureToFavourites = async (req, res) => {
    try {
        const { CreatureId } = req.body; // Extract the CreatureId from the request body
        const newFavourite = await UserFavourite.create({
            CreatureId, // ID of the creature being added to favourites
            UserId: req.userId, // User ID (assumed to be extracted from a middleware)
            AddedBy: req.userId, // Who added this favourite (same as UserId)
        });
        res.status(201).json(newFavourite); // Return the newly created favourite
    } catch (error) {
        res.status(500).json({ error: error.message }); // Send server error response
    }
};

// Remove a creature from the user's favourites by favourite ID
exports.removeCreatureFromFavourites = async (req, res) => {
    try {
        const deleted = await UserFavourite.destroy({
            where: { CreatureId: req.params.id, UserId: req.userId }, // Match by ID and user ownership
        });
        if (!deleted) return res.status(404).json({ error: 'Favourite not found' }); // If not found, return 404
        res.status(200).json({ message: 'Favourite removed successfully' }); // Confirm successful removal
    } catch (error) {
        res.status(500).json({ error: error.message }); // Send server error response
    }
};

// Update the background image for a favourite creature
exports.changeFavouriteCreatureBackground = async (req, res) => {
    try {
        const { BackgroundImg } = req.body; // Extract the new background image URL from the request body
        const favourite = await UserFavourite.update(
            { BackgroundImg }, // Update the BackgroundImg field
            { where: { Id: req.params.id, UserId: req.userId } } // Match by ID and user ownership
        );
        res.status(200).json({ message: 'Background updated successfully' }); // Confirm successful update
    } catch (error) {
        res.status(500).json({ error: error.message }); // Send server error response
    }
};

// Reset the background image for a favourite creature to default
exports.changeFavouriteCreatureBackgroundToDefault = async (req, res) => {
    try {
        const favourite = await UserFavourite.update(
            { BackgroundImg: null }, // Set BackgroundImg to null (default)
            { where: { Id: req.params.id, UserId: req.userId } } // Match by ID and user ownership
        );
        res.status(200).json({ message: 'Background reset to default' }); // Confirm successful reset
    } catch (error) {
        res.status(500).json({ error: error.message }); // Send server error response
    }
};
