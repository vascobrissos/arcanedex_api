const Creature = require('../models/creature'); // Import the Creature model
const { Op } = require('sequelize'); // Import Sequelize operators for querying

// Controller function to fetch all creatures with optional filters for name, date, pagination
exports.getAllCreatures = async (req, res) => {
    const { name, latest, page = 1, limit = 10 } = req.query; // Extract query parameters with default values

    try {
        const where = {}; // Define a filter object for query conditions
        if (name) where.Name = { [Op.like]: `%${name}%` }; // Filter creatures whose names contain the 'name' query
        if (latest) where.CreatedOn = { [Op.lt]: latest }; // Filter creatures created before the 'latest' date

        // Query the database for creatures and count total matching results
        const creatures = await Creature.findAndCountAll({
            where, // Apply filters
            attributes: ['Id', 'Name', 'Img'], // Fetch only specific fields
            limit, // Limit the number of results per page
            offset: (page - 1) * limit, // Calculate offset for pagination
        });

        // Respond with the queried data and the total count
        res.status(200).json({ data: creatures.rows, count: creatures.count });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle server errors
    }
};

// Controller function to add a new creature
exports.addCreature = async (req, res) => {
    const { Name, Lore, Img, CreatedBy } = req.body; // Extract data from the request body

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
    try {
        const { Name, Lore, Img } = req.body; // Extract updated data from the request body
        const updated = await Creature.update(
            { Name, Lore, Img }, // Fields to update
            { where: { Id: req.params.id } } // Match the creature by ID from the request params
        );

        if (!updated[0]) return res.status(404).json({ error: 'Creature not found' }); // If no rows are updated, return a 404 error
        res.status(200).json({ message: 'Creature updated successfully' }); // Respond with success message
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle server errors
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
