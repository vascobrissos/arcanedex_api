const express = require('express'); // Import Express to create the server
const bodyParser = require('body-parser'); // Import body-parser to parse incoming request bodies
const cors = require('cors'); // Import CORS to handle cross-origin resource sharing

const userRoutes = require('./routes/userRoutes'); // Import user-related routes
const creatureRoutes = require('./routes/creatureRoutes'); // Import creature-related routes
const adminCreatureRoutes = require('./routes/adminCreatureRoutes'); // Import admin creature-related routes

const app = express(); // Initialize the Express application

// Configurar body-parser com um limite maior
app.use(bodyParser.json({ limit: '15mb' })); // Permite até 5 MB
app.use(bodyParser.urlencoded({ limit: '15mb', extended: true }));

// Middleware

// Parse incoming JSON request bodies
app.use(bodyParser.json());

// Enable CORS for cross-origin requests
app.use(cors());

// Routes

// User-related routes (e.g., register, login, user profile)
app.use('/users', userRoutes);

// Public and user creature-related routes (e.g., view creatures, manage favourites)
app.use('/creatures', creatureRoutes);

// Admin-specific creature routes (e.g., manage creatures as an admin)
app.use('/admin/creatures', adminCreatureRoutes);

// Start the server

const PORT = process.env.PORT || 3000; // Use the PORT environment variable or default to 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`); // Log that the server is running and on which port
});
