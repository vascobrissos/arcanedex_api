const express = require('express'); // Import Express to create routes
const router = express.Router(); // Create a new router instance
const userController = require('../controllers/userController'); // Import the user controller
const authMiddleware = require('../middleware/authMiddleware'); // Import authentication middleware

// Public Routes

// Register a new user
router.post('/register', userController.registerUser);
// Allows new users to create an account by providing required details (e.g., username, password, email).

// Login an existing user
router.post('/login', userController.loginUser);
// Allows existing users to log in with their credentials and receive a JWT token.

// Protected Routes

// Get the profile of the currently logged-in user
router.get(
    '/profile',
    authMiddleware.verifyToken, // Middleware to verify the JWT token
    userController.getUserProfile // Retrieves the user's profile (excluding sensitive info like password).
);

// Update the currently logged-in user's profile (except username)
router.put(
    '/profile',
    authMiddleware.verifyToken, // Middleware to verify the JWT token
    userController.updateUser // Calls the `updateUser` method in the user controller
);
// Allows authenticated users to update their details (e.g., email, name, password) while keeping the username unchanged.

// Export the router to be used in other parts of the application
module.exports = router;
