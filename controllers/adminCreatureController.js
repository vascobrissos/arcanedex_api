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
    try {
        const { Name, Lore, Img, CreatedBy } = req.body; // Extract data from the request body
        const newCreature = await Creature.create({ Name, Lore, Img, CreatedBy }); // Create a new record
        res.status(201).json(newCreature); // Respond with the newly created creature
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle server errors
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
