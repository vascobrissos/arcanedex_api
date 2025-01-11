const { Sequelize } = require('sequelize'); // Import the Sequelize library, a popular ORM for Node.js

require('dotenv').config(); // Load environment variables from a .env file into process.env

// Create a Sequelize instance, connecting to a database using environment variables for credentials
const sequelize = new Sequelize(
    process.env.DB_NAME, // Database name
    process.env.DB_USER, // Database username
    process.env.DB_PASSWORD, // Database password
    {
        host: process.env.DB_HOST, // Database host (e.g., localhost, or a remote server)
        dialect: 'mysql', // Specify the database dialect (MySQL in this case)
    }
);

module.exports = sequelize; // Export the Sequelize instance for use in other parts of the application
