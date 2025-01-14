const Creature = require('../models/creature'); // Import the Creature model
const { Op } = require('sequelize'); // Import Sequelize operators for querying

// Helper function to determine the MIME type of binary image data
const getMimeType = (imgBuffer) => {
    if (!imgBuffer || imgBuffer.length < 12) return null; // Verifica se o buffer � v�lido e suficientemente longo
    const riffHeader = imgBuffer.slice(0, 4).toString('hex'); // Verifica a assinatura RIFF
    const webpHeader = imgBuffer.slice(8, 12).toString('ascii'); // Verifica o identificador WEBP

    if (riffHeader === '52494646' && webpHeader === 'WEBP') {
        return 'image/webp'; // WEBP
    }

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


// Controller function to fetch all creatures with optional filters for name, date, pagination
exports.getAllCreatures = async (req, res) => {
    const { name, latest, page = 1, limit = 10 } = req.query; // Extract query parameters with default values

    try {
        const where = {}; // Define a filter object for query conditions
        if (name) where.Name = { [Op.like]: `%${name}%` }; // Filter creatures whose names contain the 'name' query
        if (latest) where.CreatedOn = { [Op.lt]: latest }; // Filter creatures created before the 'latest' date

        // Query the database for creatures and count total matching results
        const { rows, count } = await Creature.findAndCountAll({
            where, // Apply filters
            attributes: ['Id', 'Name', 'Img', 'Lore'], // Fetch specific fields
            limit: parseInt(limit, 10), // Limit the number of results per page
            offset: (parseInt(page, 10) - 1) * parseInt(limit, 10), // Calculate offset for pagination
        });

        // Transform the creatures to include Base64 encoded images
        const transformedCreatures = rows.map(creature => {
            const mimeType = creature.Img ? getMimeType(creature.Img) : null;
            return {
                Id: creature.Id,
                Name: creature.Name,
                Img: creature.Img
                    ? `data:${mimeType};base64,${creature.Img.toString('base64')}`
                    : null,
                Lore: creature.Lore,
            };
        });

        // Count the total number of creatures in the database (ignoring pagination)
        const totalCreatures = await Creature.count({ where });

        // Respond with the transformed data, total count, and filtered count
        res.status(200).json({
            data: transformedCreatures,
            filteredCount: count, // Count of creatures after applying filters
            totalCount: totalCreatures, // Total count of creatures in the database
        });
    } catch (error) {
        console.error('Error fetching creatures:', error);
        res.status(500).json({ error: 'Failed to fetch creatures. Please try again.' });
    }
};

// Controller function to add a new creature
exports.addCreature = async (req, res) => {
    const { Name, Lore, Img } = req.body; // Extract data from the request body

    const CreatedBy = req.userId;

	console.log(Img)

    try {
        // Check if a creature with the same name already exists
        const existingCreature = await Creature.findOne({ where: { Name } });
        if (existingCreature) {
            return res.status(400).json({ error: 'A creature with this name already exists.' });
        }

        // Decode the Base64 image if provided
        let buffer = null;
        if (Img) {
            const base64Data = Img.split(',')[1]; // Remove the "data:image/jpeg;base64," prefix
            buffer = Buffer.from(base64Data, 'base64'); // Convert to binary buffer
        }

        // Start a transaction to ensure atomicity
        const result = await Creature.sequelize.transaction(async (transaction) => {
            // Save the creature to the database within the transaction
            const newCreature = await Creature.create(
                {
                    Name,
                    Lore,
                    Img: buffer, // Save the binary data in the MEDIUMBLOB column
                    CreatedBy,
                },
                { transaction }
            );
            return newCreature;
        });

        // Respond with the newly created creature
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding creature:', error);

        // Handle known errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ error: 'Creature name must be unique.' });
        } else {
            res.status(500).json({ error: 'Failed to add creature.' });
        }
    }
};



// Controller function to update a creature's details
exports.editCreature = async (req, res) => {
    const { Name, Lore, Img } = req.body; // Extract updated data from the request body
console.log(req.params.id)
    try {
console.log("Tipo MIME recebido:", req.body.Img.split(";")[0]);
        // Decode the Base64 image if provided
        let buffer = null;
        if (Img) {
            const base64Data = Img.split(',')[1]; // Remove the "data:image/jpeg;base64," prefix
            buffer = Buffer.from(base64Data, 'base64'); // Convert to binary buffer
        }

        // Update the creature's details in the database
        const updated = await Creature.update(
            { 
                Name, 
                Lore, 
                Img: buffer // Save the binary data in the MEDIUMBLOB column
            },
            { where: { Id: req.params.id } } // Match the creature by ID from the request params
        );

        if (!updated[0]) {
            return res.status(404).json({ error: 'Creature not found' }); // If no rows are updated, return a 404 error
        }

        res.status(200).json({ message: 'Creature updated successfully' }); // Respond with success message
    } catch (error) {
        console.error('Error updating creature:', error);
        res.status(500).json({ error: 'Failed to update creature.' }); // Handle server errors
    }
};

// Controller function to delete a creature by ID
exports.deleteCreature = async (req, res) => {
    try {
        const deleted = await Creature.destroy({ where: { Id: req.params.id } }); // Delete the record by ID
        if (!deleted) return res.status(404).json({ error: 'Creature not found' }); // If no rows are deleted, return a 404 error
        res.status(200).json({ message: 'Creature deleted successfully' }); // Respond with success message
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle server errors
    }
};
