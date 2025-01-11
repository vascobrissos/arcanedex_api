const express = require('express'); // Import Express to create routes
const router = express.Router(); // Create a new router instance
const userController = require('../controllers/userController'); // Import the user controller
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

// Public Routes

// Register a new user
router.post('/register', userController.registerUser); 
// Calls the `registerUser` method in the user controller
// This route is publicly accessible and allows new users to create accounts

// Login an existing user
router.post('/login', userController.loginUser); 
// Calls the `loginUser` method in the user controller
// This route is publicly accessible and allows users to log in and receive a JWT token

// Protected Route

// Get the profile of the currently logged-in user
router.get(
    '/profile', 
    authMiddleware.verifyToken, // Middleware to verify the user's JWT token
    userController.getUserProfile // Calls the `getUserProfile` method in the user controller
);
// This route is protected and requires the user to be authenticated
// The token is verified before allowing access to the user's profile

module.exports = router; // Export the router to use in other parts of the application
