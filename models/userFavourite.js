const { DataTypes } = require('sequelize'); // Importa o DataTypes para definir os atributos do modelo
const sequelize = require('../config/database'); // Importa a instância do Sequelize configurada para a base de dados

// Define o modelo 'UserFavourite'
const UserFavourite = sequelize.define('UserFavourite', {
    Id: {
        type: DataTypes.INTEGER, // Tipo inteiro para a chave primária
        primaryKey: true, // Define como chave primária
        autoIncrement: true, // Ativa o auto-incremento para os IDs
    },
    CreatureId: DataTypes.INTEGER, // Chave estrangeira para referenciar a criatura marcada como favorita
    UserId: DataTypes.INTEGER, // Chave estrangeira para referenciar o utilizador que adicionou o favorito
    BackgroundImg: {
        type: DataTypes.BLOB('medium'), // Objeto binário de tamanho médio para armazenar uma imagem de fundo personalizada
        allowNull: true, // Permite que o campo da imagem de fundo seja nulo
    },
    AddedOn: {
        type: DataTypes.DATE, // Tipo data para armazenar quando o favorito foi adicionado
        defaultValue: DataTypes.NOW, // Valor por defeito é a data e hora atual
    },
    AddedBy: DataTypes.INTEGER, // ID do utilizador que adicionou o favorito
    UpdatedOn: {
        type: DataTypes.DATE, // Tipo data para armazenar quando o favorito foi atualizado pela última vez
        defaultValue: DataTypes.NOW, // Valor por defeito é a data e hora atual
    },
    UpdatedBy: DataTypes.INTEGER, // ID do utilizador que atualizou o favorito pela última vez
}, {
    timestamps: false, // Desativa os campos automáticos de timestamp (createdAt, updatedAt)
});

module.exports = UserFavourite; // Exporta o modelo 'UserFavourite' para uso noutras partes da aplicação
