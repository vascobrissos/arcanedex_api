const { DataTypes } = require('sequelize'); // Import DataTypes to define model attributes
const sequelize = require('../config/database'); // Import the Sequelize instance configured for the database

// Define the 'Creature' model
const Creature = sequelize.define('Creature', {
    Id: {
        type: DataTypes.INTEGER, // Integer type for the primary key
        primaryKey: true, // Mark as primary key
        autoIncrement: true, // Enable auto-increment for IDs
    },
    Name: DataTypes.STRING, // String type for the name of the creature
    Lore: DataTypes.TEXT, // Text type for the lore/description of the creature
    CreatedBy: DataTypes.INTEGER, // Integer type to store the ID of the user who created the creature
    CreatedOn: {
        type: DataTypes.DATE, // Date type for creation timestamp
        defaultValue: DataTypes.NOW, // Default value is the current date and time
    },
    UpdatedBy: DataTypes.INTEGER, // Integer type to store the ID of the user who last updated the creature
    UpdatedOn: {
        type: DataTypes.DATE, // Date type for the last updated timestamp
        defaultValue: DataTypes.NOW, // Default value is the current date and time
    },
    Img: {
        type: DataTypes.BLOB('medium'), // Medium-sized binary large object for storing images
        allowNull: true, // Allow the image field to be null
    },
}, {
    timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt)
});

module.exports = Creature; // Export the 'Creature' model for use in other parts of the application
