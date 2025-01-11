const { DataTypes } = require('sequelize'); // Import DataTypes to define model attributes
const sequelize = require('../config/database'); // Import the Sequelize instance configured for the database

// Define the 'UserFavourite' model
const UserFavourite = sequelize.define('UserFavourite', {
    Id: {
        type: DataTypes.INTEGER, // Integer type for the primary key
        primaryKey: true, // Mark as primary key
        autoIncrement: true, // Enable auto-increment for IDs
    },
    CreatureId: DataTypes.INTEGER, // Foreign key to reference the creature being favorited
    UserId: DataTypes.INTEGER, // Foreign key to reference the user who added the favorite
    BackgroundImg: {
        type: DataTypes.BLOB('medium'), // Medium-sized binary large object for storing a custom background image
        allowNull: true, // Allow the background image field to be null
    },
    AddedOn: {
        type: DataTypes.DATE, // Date type to store when the favorite was added
        defaultValue: DataTypes.NOW, // Default value is the current date and time
    },
    AddedBy: DataTypes.INTEGER, // ID of the user who added the favorite
    UpdatedOn: {
        type: DataTypes.DATE, // Date type to store when the favorite was last updated
        defaultValue: DataTypes.NOW, // Default value is the current date and time
    },
    UpdatedBy: DataTypes.INTEGER, // ID of the user who last updated the favorite
}, {
    timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt)
});

module.exports = UserFavourite; // Export the 'UserFavourite' model for use in other parts of the application
