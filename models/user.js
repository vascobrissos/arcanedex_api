const { DataTypes } = require('sequelize'); // Importa o DataTypes para definir os atributos do modelo
const sequelize = require('../config/database'); // Importa a instância do Sequelize configurada para a base de dados

// Define o modelo 'User'
const User = sequelize.define('User', {
    Id: {
        type: DataTypes.INTEGER, // Tipo inteiro para a chave primária
        primaryKey: true, // Define como chave primária
        autoIncrement: true, // Ativa o auto-incremento para os IDs
    },
    FirstName: DataTypes.STRING, // Tipo string para o primeiro nome do utilizador
    LastName: DataTypes.STRING, // Tipo string para o apelido do utilizador
    Email: {
        type: DataTypes.STRING, // Tipo string para o email do utilizador
        unique: true, // Garante que o email seja único
        allowNull: false, // O email não pode ser nulo
    },
    Genero: {
        type: DataTypes.ENUM('Masculino', 'Feminino', 'Outro'), // Enumeração para as opções de género
        allowNull: false, // O género não pode ser nulo
    },
    Username: {
        type: DataTypes.STRING, // Tipo string para o nome de utilizador
        unique: true, // Garante que o nome de utilizador seja único
        allowNull: false, // O nome de utilizador não pode ser nulo
    },
    Password: {
        type: DataTypes.STRING, // Tipo string para a palavra-passe encriptada
        allowNull: false, // A palavra-passe não pode ser nula
    },
    Role: {
        type: DataTypes.ENUM('Admin', 'User'), // Enumeração para os papéis de utilizador
        allowNull: false, // O papel não pode ser nulo
    },
}, { 
    timestamps: false, // Desativa os campos automáticos de timestamp (createdAt, updatedAt)
});

module.exports = User; // Exporta o modelo 'User' para uso noutras partes da aplicação
