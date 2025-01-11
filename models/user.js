const { DataTypes } = require('sequelize'); // Import DataTypes to define model attributes
const sequelize = require('../config/database'); // Import the Sequelize instance configured for the database

// Define the 'User' model
const User = sequelize.define('User', {
    Id: {
        type: DataTypes.INTEGER, // Integer type for the primary key
        primaryKey: true, // Mark as primary key
        autoIncrement: true, // Enable auto-increment for IDs
    },
    FirstName: DataTypes.STRING, // String type for the user's first name
    LastName: DataTypes.STRING, // String type for the user's last name
    Email: {
        type: DataTypes.STRING, // String type for the email
        unique: true, // Ensure email is unique
        allowNull: false, // Email cannot be null
    },
    Genero: {
        type: DataTypes.ENUM('Masculino', 'Feminino', 'Outro'), // Enum for gender options
        allowNull: false, // Gender cannot be null
    },
    Username: {
        type: DataTypes.STRING, // String type for the username
        unique: true, // Ensure username is unique
        allowNull: false, // Username cannot be null
    },
    Password: {
        type: DataTypes.STRING, // String type for the hashed password
        allowNull: false, // Password cannot be null
    },
    Role: {
        type: DataTypes.ENUM('Admin', 'User'), // Enum for user roles
        allowNull: false, // Role cannot be null
    },
}, { 
    timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt)
});

module.exports = User; // Export the 'User' model for use in other parts of the application
