const User = require('../models/user'); // Import the User model
const jwt = require('jsonwebtoken'); // Import the JWT library for token generation and verification
const bcrypt = require('bcrypt'); // Import bcrypt for hashing passwords
require('dotenv').config(); // Load environment variables from a .env file into process.env
const UserFavourite = require('../models/userFavourite'); // Ajuste o caminho se necessário
const Creature = require('../models/creature'); // Ajuste o caminho se necessário



exports.registerUser = async (req, res) => {
    try {
        const { FirstName, LastName, Email, Genero, Username, Password, Role } = req.body;

        // Input validation
        if (!FirstName || !LastName || !Email || !Username || !Password || !Role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const emailExists = await User.findOne({ where: { Email } });
        if (emailExists) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const usernameExists = await User.findOne({ where: { Username } });
        if (usernameExists) {
            return res.status(400).json({ error: 'Username already in use' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Insert the new user
        const newUser = await User.create({
            FirstName,
            LastName,
            Email,
            Genero,
            Username,
            Password: hashedPassword,
            Role,
        });

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Update user profile (except username)
exports.updateUser = async (req, res) => {
    try {
        const userId = req.userId; // Extract user ID from the JWT middleware
        const { FirstName, LastName, Email, Genero, Password } = req.body;

        // Validate required fields
        if (!FirstName && !LastName && !Email && !Genero && !Password) {
            return res.status(400).json({ error: 'At least one field must be updated' });
        }

        const user = await User.findByPk(userId); // Find the user by primary key
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If email is being updated, check for uniqueness
        if (Email && Email !== user.Email) {
            const emailExists = await User.findOne({ where: { Email } });
            if (emailExists) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        // Update user fields
        if (FirstName) user.FirstName = FirstName;
        if (LastName) user.LastName = LastName;
        if (Email) user.Email = Email;
        if (Genero) user.Genero = Genero;
        if (Password) user.Password = await bcrypt.hash(Password, 10); // Hash the new password

        await user.save(); // Save the changes to the database

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.deleteUserAccount = async (req, res) => {
    try {
        const userId = req.userId; // O ID do usuário é obtido através do middleware de autenticação
	console.log("teste");
        // Verificar se o usuário existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Iniciar transação para garantir consistência
        const transaction = await User.sequelize.transaction();

        try {
            // 1. Remover favoritos associados ao usuário
            await UserFavourite.destroy({ where: { UserId: userId }, transaction });

            // 2. Opcional: Tratar registros criados pelo usuário
            // Aqui você pode remover ou transferir a propriedade de criaturas
            const userCreatures = await Creature.findAll({ where: { CreatedBy: userId } });
            if (userCreatures.length > 0) {
                // Remover criaturas criadas pelo usuário
                await Creature.destroy({ where: { CreatedBy: userId }, transaction });
            }

            // 3. Remover o usuário
            await User.destroy({ where: { Id: userId }, transaction });

            // Commit da transação
            await transaction.commit();

            res.status(200).json({ message: 'User account deleted successfully' });
        } catch (err) {
            // Rollback em caso de erro
            await transaction.rollback();
            console.error('Error deleting user account:', err);
            res.status(500).json({ error: 'Failed to delete user account' });
        }
    } catch (error) {
        console.error('Error in deleteUserAccount:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
