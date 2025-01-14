const { DataTypes } = require('sequelize'); // Importa o DataTypes para definir os atributos do modelo
const sequelize = require('../config/database'); // Importa a instância do Sequelize configurada para a base de dados

// Define o modelo 'Creature'
const Creature = sequelize.define('Creature', {
    Id: {
        type: DataTypes.INTEGER, // Tipo inteiro para a chave primária
        primaryKey: true, // Define como chave primária
        autoIncrement: true, // Ativa auto-incremento para os IDs
    },
    Name: DataTypes.STRING, // Tipo string para o nome da criatura
    Lore: DataTypes.TEXT, // Tipo texto para a descrição/história da criatura
    CreatedBy: DataTypes.INTEGER, // Tipo inteiro para armazenar o ID do utilizador que criou a criatura
    CreatedOn: {
        type: DataTypes.DATE, // Tipo data para o registo de criação
        defaultValue: DataTypes.NOW, // Valor padrão é a data e hora atuais
    },
    UpdatedBy: DataTypes.INTEGER, // Tipo inteiro para armazenar o ID do utilizador que atualizou a criatura pela última vez
    UpdatedOn: {
        type: DataTypes.DATE, // Tipo data para o registo da última atualização
        defaultValue: DataTypes.NOW, // Valor padrão é a data e hora atuais
    },
    Img: {
        type: DataTypes.BLOB('medium'), // Objeto binário de tamanho médio para armazenar imagens
        allowNull: true, // Permite que o campo de imagem seja nulo
    },
}, {
    timestamps: false, // Desativa os campos automáticos de timestamp (createdAt, updatedAt)
});

module.exports = Creature; // Exporta o modelo 'Creature' para uso noutras partes da aplicação
