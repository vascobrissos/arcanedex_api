const express = require('express'); // Import Express to create routes
const router = express.Router(); // Create a new router instance
const adminCreatureController = require('../controllers/adminCreatureController'); // Import the admin creature controller
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

// Middleware to check if the user has the 'Admin' role
const roleMiddleware = (req, res, next) => {
    if (req.userRole !== 'Admin') { // Check if the user's role is not 'Admin'
        return res.status(403).json({ error: 'Access forbidden: Admins only' }); // Return 403 Forbidden if not an admin
    }
    next(); // If the user is an admin, proceed to the next middleware or route handler
};

// Protected Admin Routes

// Get all creatures (admin only)
router.get(
    '/',
    authMiddleware.verifyToken, // Verify the user's token
    roleMiddleware, // Check if the user is an admin
    adminCreatureController.getAllCreatures // Controller to fetch all creatures
);

// Add a new creature (admin only)
router.post(
    '/',
    authMiddleware.verifyToken, // Verify the user's token
    roleMiddleware, // Check if the user is an admin
    adminCreatureController.addCreature // Controller to add a new creature
);

// Edit an existing creature by ID (admin only)
router.put(
    '/:id',
    authMiddleware.verifyToken, // Verify the user's token
    roleMiddleware, // Check if the user is an admin
    adminCreatureController.editCreature // Controller to edit an existing creature
);

// Delete a creature by ID (admin only)
router.delete(
    '/:id',
    authMiddleware.verifyToken, // Verify the user's token
    roleMiddleware, // Check if the user is an admin
    adminCreatureController.deleteCreature // Controller to delete a creature
);

module.exports = router; // Export the router to use in other parts of the application
