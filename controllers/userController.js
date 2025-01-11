const User = require('../models/user'); // Import the User model
const jwt = require('jsonwebtoken'); // Import the JWT library for token generation and verification
const bcrypt = require('bcrypt'); // Import bcrypt for hashing passwords
require('dotenv').config(); // Load environment variables from a .env file into process.env

// Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { FirstName, LastName, Email, Genero, Username, Password, Role } = req.body; // Extract user details from the request body
        const hashedPassword = await bcrypt.hash(Password, 10); // Hash the password with a salt factor of 10
        const newUser = await User.create({
            FirstName,
            LastName,
            Email,
            Genero,
            Username,
            Password: hashedPassword, // Store the hashed password
            Role,
        });
        res.status(201).json(newUser); // Respond with the newly created user
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle server errors
    }
};

// Log in an existing user
exports.loginUser = async (req, res) => {
    try {
        const { Username, Password } = req.body; // Extract login credentials from the request body
        const user = await User.findOne({ where: { Username } }); // Find the user by username
        if (!user) return res.status(404).json({ error: 'User not found' }); // If user not found, return 404 error

        const validPassword = await bcrypt.compare(Password, user.Password); // Compare the provided password with the hashed password
        if (!validPassword) return res.status(401).json({ error: 'Invalid password' }); // If password is invalid, return 401 error

        const token = jwt.sign(
            { id: user.Id, role: user.Role }, // Payload containing user ID and role
            process.env.JWT_SECRET, // Secret key from environment variables
            { expiresIn: '1h' } // Token expiration time
        );
        res.status(200).json({ token }); // Respond with the JWT token
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle server errors
    }
};

// Get the profile of the currently logged-in user
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            attributes: { exclude: ['Password'] }, // Exclude the password field from the result
        });
        if (!user) return res.status(404).json({ error: 'User not found' }); // If user not found, return 404 error
        res.status(200).json(user); // Respond with the user profile
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle server errors
    }
};
