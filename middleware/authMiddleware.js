const jwt = require('jsonwebtoken'); // Import the JSON Web Token library for token verification
require('dotenv').config(); // Load environment variables from a .env file into process.env

// Middleware to verify the JWT token in the request
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Retrieve the Authorization header from the request
    if (!authHeader) return res.status(401).json({ error: 'Token missing' }); // If no Authorization header, return 401 (Unauthorized)

    const token = authHeader.split(' ')[1]; // Extract the token part (assuming "Bearer <token>" format)
    if (!token) return res.status(401).json({ error: 'Token missing' }); // If token is missing, return 401 (Unauthorized)

    // Verify the token using the secret key
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' }); // If verification fails, return 401 (Unauthorized)

        req.userId = decoded.id; // Attach the user ID from the token payload to the request object
        req.userRole = decoded.role; // Attach the user role from the token payload to the request object
        next(); // Proceed to the next middleware or route handler
    });
};
