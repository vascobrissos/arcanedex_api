const express = require('express'); // Import Express to create routes
const router = express.Router(); // Create a new router instance
const creatureController = require('../controllers/creatureController'); // Import the creature controller
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

// Public Routes


// Protected Routes (Require Authentication)

// Get all creatures
router.get('/',
    authMiddleware.verifyToken, // Middleware to verify the user's token
    creatureController.getAllCreatures
);

// Get details of a specific creature by ID
router.get('/:id', 
    authMiddleware.verifyToken, // Middleware to verify the user's token
    creatureController.getCreatureDetails);

// Add a creature to the user's favourites
router.post(
    '/favourites',
    authMiddleware.verifyToken, // Middleware to verify the user's token
    creatureController.addCreatureToFavourites // Controller to add a creature to favourites
);

// Remove a creature from the user's favourites by ID
router.delete(
    '/favourites/:id',
    authMiddleware.verifyToken, // Middleware to verify the user's token
    creatureController.removeCreatureFromFavourites // Controller to remove a favourite by ID
);

// Update the background image of a favourite creature
router.put(
    '/favourites/:id/background',
    authMiddleware.verifyToken, // Middleware to verify the user's token
    creatureController.changeFavouriteCreatureBackground // Controller to update the background image
);

// Reset the background image of a favourite creature to default
router.put(
    '/favourites/:id/background/default',
    authMiddleware.verifyToken, // Middleware to verify the user's token
    creatureController.changeFavouriteCreatureBackgroundToDefault // Controller to reset the background image to default
);

module.exports = router; // Export the router to use in other parts of the application
