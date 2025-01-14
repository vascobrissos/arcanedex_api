const Creature = require('../models/creature'); // Import the Creature model
const UserFavourite = require('../models/userFavourite'); // Import the UserFavourite model
const { Op } = require('sequelize'); // Import Sequelize operators for querying

// Helper function to determine the MIME type of binary image data
const getMimeType = (imgBuffer) => {
    if (!imgBuffer || imgBuffer.length < 4) return null; // Verifica se o buffer é válido
    const signature = imgBuffer.slice(0, 4).toString('hex');
    switch (signature) {
        case '89504e47': return 'image/png'; // PNG
        case 'ffd8ffe0': 
        case 'ffd8ffe1': 
        case 'ffd8ffe2': 
        case 'ffd8ffe3': 
        case 'ffd8ffe8': return 'image/jpeg'; // JPEG
        case '47494638': return 'image/gif'; // GIF
        case '49492a00': 
        case '4d4d002a': return 'image/tiff'; // TIFF
        default: return 'application/octet-stream'; // Tipo desconhecido
    }
};

// Endpoint para buscar todas as criaturas
exports.getAllCreatures = async (req, res) => {
    const { name, latest, page = 1, limit = 10, OnlyFavoriteArcanes = false, ToSaveOffline = false } = req.query;
    const userId = req.userId; // Assumindo que o userId vem do middleware de autentica  o

    try {
        // Construir condi  es de filtro
        const where = {};
        if (name && name.trim() !== "") {
            where.Name = { [Op.like]: `%${name}%` }; // Filtro parcial por nome
        }
        if (latest) {
            where.CreatedOn = { [Op.lt]: latest }; // Filtro por data de cria  o
        }

        // Verificar condi  es especiais para favoritos ou salvar offline
        if (ToSaveOffline === 'true') {
            // Se ToSaveOffline for true, ignorar favoritos e devolver 10 registros
            const monsters = await Creature.findAll({
                attributes: ['Id', 'Name', 'Img', 'Lore'],
                limit: 10,
            });

            const transformedCreatures = monsters.map(creature => {
                const mimeType = creature.Img ? getMimeType(creature.Img) : null;
                return {
                    Id: creature.Id,
                    Name: creature.Name,
                    Img: creature.Img
                        ? `data:${mimeType};base64,${creature.Img.toString('base64')}` // Converter Buffer para Base64 com MIME
                        : null,
                    Lore: creature.Lore,
                    isFavoriteToUser: false, // N o importa favoritos neste caso
                };
            });

            return res.status(200).json({
                data: transformedCreatures,
                count: transformedCreatures.length, // Retornar apenas os 10 registros
            });
        }

        let favoriteIds = [];
        if (OnlyFavoriteArcanes === 'true') {
            const favorites = await UserFavourite.findAll({
                where: { UserId: userId },
                attributes: ['CreatureId'],
                raw: true,
            });
            favoriteIds = favorites.map(fav => fav.CreatureId);

            where.Id = { [Op.in]: favoriteIds }; // Apenas favoritos
        } else if (OnlyFavoriteArcanes === 'false') {
            const favorites = await UserFavourite.findAll({
                where: { UserId: userId },
                attributes: ['CreatureId'],
                raw: true,
            });
            favoriteIds = favorites.map(fav => fav.CreatureId);

            where.Id = { [Op.notIn]: favoriteIds }; // Apenas n o favoritos
        }

        // Consultar com pagina  o
        const { rows, count } = await Creature.findAndCountAll({
            where,
            attributes: ['Id', 'Name', 'Img', 'Lore'],
            limit: parseInt(limit, 10),
            offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        });

        const transformedCreatures = rows.map(creature => {
            const mimeType = creature.Img ? getMimeType(creature.Img) : null;
            return {
                Id: creature.Id,
                Name: creature.Name,
                Img: creature.Img
                    ? `data:${mimeType};base64,${creature.Img.toString('base64')}` // Converter Buffer para Base64 com MIME
                    : null,
                Lore: creature.Lore,
                isFavoriteToUser: favoriteIds.includes(creature.Id), // Verificar se   favorito
            };
        });

        return res.status(200).json({ data: transformedCreatures, count });
    } catch (error) {
        console.error('Erro ao buscar criaturas:', error);
        return res.status(500).json({ error: 'Falha ao buscar criaturas. Por favor, tente novamente.' });
    }
};

// Fetch BackgroundImg for a creature favorited by the user
exports.getCreatureDetails = async (req, res) => {
    try {
        console.log("Fetching creature details...");

        const favorite = await UserFavourite.findOne({
            where: {
                CreatureId: req.params.id,
                UserId: req.userId,
            },
            attributes: ['BackgroundImg'], // Fetch only the BackgroundImg field
        });

        if (!favorite) {
            return res.status(404).json({ error: 'Favourite not found for this user and creature.' });
        }

        let backgroundImgBase64 = null;

        if (favorite.BackgroundImg) {
            const mimeType = getMimeType(favorite.BackgroundImg);

            if (!mimeType || mimeType === 'application/octet-stream') {
                console.log("Buffer Signature:", favorite.BackgroundImg.slice(0, 4).toString('hex'));
                return res.status(400).json({ error: 'Unsupported image format.' });
            }

            backgroundImgBase64 = `data:${mimeType};base64,${favorite.BackgroundImg.toString('base64')}`;
            console.log("Detected MIME Type:", mimeType);
        }

        res.status(200).json({
            BackgroundImg: backgroundImgBase64, // Return Base64-encoded image with MIME type
        });
    } catch (error) {
        console.error('Error fetching favorite background image:', error);
        res.status(500).json({ error: 'Failed to fetch background image. Please try again.' });
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
        const { BackgroundImg } = req.body;

        if (!BackgroundImg) {
            return res.status(400).json({ error: 'BackgroundImg is required' });
        }

        // Decode the Base64 image if provided
        let buffer = null;
        if (BackgroundImg) {
            const base64Data = BackgroundImg.split(',')[1]; // Remove the "data:image/jpeg;base64," prefix
            buffer = Buffer.from(base64Data, 'base64'); // Convert to binary buffer
        }

        const updated = await UserFavourite.update(
            { BackgroundImg: buffer }, // Save the binary data
            { where: { CreatureId: req.params.id, UserId: req.userId } }
        );

        if (updated[0] === 0) {
            return res.status(404).json({ error: 'Favourite not found' });
        }

        res.status(200).json({ message: 'Background updated successfully' });
    } catch (error) {
        console.error('Error updating background image:', error);
        res.status(500).json({ error: 'Failed to update background image.' });
    }
};

// Reset the background image for a favourite creature to default
exports.changeFavouriteCreatureBackgroundToDefault = async (req, res) => {
    try {
        const reset = await UserFavourite.update(
            { BackgroundImg: null },
            { where: { CreatureId: req.params.id, UserId: req.userId } }
        );

        if (reset[0] === 0) {
            return res.status(404).json({ error: 'Favourite not found' });
        }

        res.status(200).json({ message: 'Background reset to default successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to reset background image.' });
    }
};
