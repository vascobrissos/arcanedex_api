const User = require('../models/user'); // Importa o modelo de utilizador
const jwt = require('jsonwebtoken'); // Biblioteca para geração e verificação de tokens JWT
const bcrypt = require('bcrypt'); // Biblioteca para hashing de passwords
require('dotenv').config(); // Carrega variáveis de ambiente do ficheiro .env
const UserFavourite = require('../models/userFavourite'); // Modelo para favoritos do utilizador
const Creature = require('../models/creature'); // Modelo para criaturas

// Registar um novo utilizador
exports.registerUser = async (req, res) => {
    try {
        const { FirstName, LastName, Email, Genero, Username, Password, Role } = req.body;

        // Validação dos campos obrigatórios
        if (!FirstName || !LastName || !Email || !Username || !Password || !Role) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        // Verificar se o email já existe
        const emailExists = await User.findOne({ where: { Email } });
        if (emailExists) {
            return res.status(400).json({ error: 'Email já está em uso' });
        }

        // Verificar se o nome de utilizador já existe
        const usernameExists = await User.findOne({ where: { Username } });
        if (usernameExists) {
            return res.status(400).json({ error: 'Nome de utilizador já está em uso' });
        }

        // Hash da password
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Inserir o novo utilizador na base de dados
        const newUser = await User.create({
            FirstName,
            LastName,
            Email,
            Genero,
            Username,
            Password: hashedPassword,
            Role,
        });

        res.status(201).json(newUser); // Resposta com o utilizador criado
    } catch (error) {
        res.status(500).json({ error: error.message }); // Erro do servidor
    }
};

// Login de um utilizador existente
exports.loginUser = async (req, res) => {
    try {
        const { Username, Password } = req.body; // Extrair credenciais do pedido
        const user = await User.findOne({ where: { Username } }); // Procurar utilizador pelo nome de utilizador
        if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

        // Comparar a password fornecida com a armazenada (hash)
        const validPassword = await bcrypt.compare(Password, user.Password);
        if (!validPassword) return res.status(401).json({ error: 'Password inválida' });

        // Gerar um token JWT
        const token = jwt.sign(
            { id: user.Id, role: user.Role }, // Payload do token
            process.env.JWT_SECRET, // Chave secreta
            { expiresIn: '1h' } // Tempo de expiração do token
        );

        res.status(200).json({ token }); // Responder com o token
    } catch (error) {
        res.status(500).json({ error: error.message }); // Erro do servidor
    }
};

// Obter o perfil do utilizador autenticado
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            attributes: { exclude: ['Password'] }, // Excluir o campo da password
        });

        if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
        res.status(200).json(user); // Responder com o perfil do utilizador
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Atualizar o perfil do utilizador (exceto o nome de utilizador)
exports.updateUser = async (req, res) => {
    try {
        const userId = req.userId; // ID do utilizador autenticado
        const { FirstName, LastName, Email, Genero, Password } = req.body;

        // Validação: pelo menos um campo deve ser atualizado
        if (!FirstName && !LastName && !Email && !Genero && !Password) {
            return res.status(400).json({ error: 'Pelo menos um campo deve ser atualizado' });
        }

        const user = await User.findByPk(userId); // Encontrar utilizador pelo ID
        if (!user) {
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }

        // Verificar unicidade do email (se atualizado)
        if (Email && Email !== user.Email) {
            const emailExists = await User.findOne({ where: { Email } });
            if (emailExists) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }
        }

        // Atualizar os campos
        if (FirstName) user.FirstName = FirstName;
        if (LastName) user.LastName = LastName;
        if (Email) user.Email = Email;
        if (Genero) user.Genero = Genero;
        if (Password) user.Password = await bcrypt.hash(Password, 10); // Hash da nova password

        await user.save(); // Salvar as alterações

        res.status(200).json({ message: 'Perfil atualizado com sucesso', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Apagar a conta do utilizador
exports.deleteUserAccount = async (req, res) => {
    try {
        const userId = req.userId; // ID do utilizador autenticado

        // Verificar se o utilizador existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }

        // Iniciar uma transação para garantir consistência
        const transaction = await User.sequelize.transaction();

        try {
            // Remover favoritos associados ao utilizador
            await UserFavourite.destroy({ where: { UserId: userId }, transaction });

            // Opcional: Remover criaturas criadas pelo utilizador
            const userCreatures = await Creature.findAll({ where: { CreatedBy: userId } });
            if (userCreatures.length > 0) {
                await Creature.destroy({ where: { CreatedBy: userId }, transaction });
            }

            // Apagar o utilizador
            await User.destroy({ where: { Id: userId }, transaction });

            // Commit da transação
            await transaction.commit();

            res.status(200).json({ message: 'Conta apagada com sucesso' });
        } catch (err) {
            // Rollback em caso de erro
            await transaction.rollback();
            console.error('Erro ao apagar a conta:', err);
            res.status(500).json({ error: 'Falha ao apagar a conta do utilizador' });
        }
    } catch (error) {
        console.error('Erro em deleteUserAccount:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
};
