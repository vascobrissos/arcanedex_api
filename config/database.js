const { Sequelize } = require('sequelize'); // Importa a biblioteca Sequelize, um ORM popular para Node.js

require('dotenv').config(); // Carrega variáveis de ambiente de um ficheiro .env para process.env

// Cria uma instância do Sequelize, ligando a uma base de dados usando variáveis de ambiente para as credenciais
const sequelize = new Sequelize(
    process.env.DB_NAME, // Nome da base de dados
    process.env.DB_USER, // Nome de utilizador da base de dados
    process.env.DB_PASSWORD, // Palavra-passe da base de dados
    {
        host: process.env.DB_HOST, // Host da base de dados (ex.: localhost ou servidor remoto)
        dialect: 'mysql', // Especifica o tipo de base de dados (MySQL neste caso)
    }
);

module.exports = sequelize; // Exporta a instância do Sequelize para ser utilizada noutras partes da aplicação
