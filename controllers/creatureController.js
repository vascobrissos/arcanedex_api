const Creature = require('../models/creature'); // Import the Creature model
const UserFavourite = require('../models/userFavourite'); // Import the UserFavourite model
const { Op } = require('sequelize'); // Import Sequelize operators for querying

// Fetch all creatures with optional filters for name, latest creation date, and pagination
exports.getAllCreatures = async (req, res) => {
    const { name, latest, page = 1, limit = 10 } = req.query; // Extract query parameters with defaults

    try {
        const where = {}; // Initialize filter conditions
        if (name) where.Name = { [Op.like]: `%${name}%` }; // Filter by name (case-insensitive, partial match)
        if (latest) where.CreatedOn = { [Op.lt]: latest }; // Filter by creation date (less than 'latest')

        const creatures = await Creature.findAndCountAll({
            where, // Apply filter conditions
            attributes: ['Id', 'Name', 'Img'], // Select specific fields to return
            limit: parseInt(limit, 10), // Convert limit to integer
            offset: (parseInt(page, 10) - 1) * parseInt(limit, 10), // Calculate offset for pagination
        });

        res.status(200).json({ data: creatures.rows, count: creatures.count }); // Send data and total count
    } catch (error) {
        console.error('Error fetching creatures:', error); // Log error for debugging
        res.status(500).json({ error: error.message }); // Send server error response
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
            where: { Id: req.params.id, UserId: req.userId }, // Match by ID and user ownership
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
