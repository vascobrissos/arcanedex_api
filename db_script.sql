-- Excluir a base de dados se já existir
DROP DATABASE IF EXISTS arcanedex;

-- Criar a base de dados
CREATE DATABASE arcanedex;

-- Usar a base de dados recém-criada
USE arcanedex;

-- Tabela Users
CREATE TABLE
    Users (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        FirstName VARCHAR(50) NOT NULL,
        LastName VARCHAR(50) NOT NULL,
        Email VARCHAR(100) UNIQUE NOT NULL,
        Genero ENUM ('Masculino', 'Feminino', 'Outro') NOT NULL,
        Username VARCHAR(50) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Role ENUM ('Admin', 'User') NOT NULL
    );

-- Tabela Creatures
CREATE TABLE
    Creatures (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Lore TEXT,
        CreatedBy INT NOT NULL,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedBy INT,
        UpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        Img MEDIUMBLOB,
        FOREIGN KEY (CreatedBy) REFERENCES Users (Id),
        FOREIGN KEY (UpdatedBy) REFERENCES Users (Id)
    );

-- Tabela UserFavourites
CREATE TABLE
    UserFavourites (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        CreatureId INT NOT NULL,
        UserId INT NOT NULL,
        BackgroundImg MEDIUMBLOB,
        AddedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        AddedBy INT NOT NULL,
        UpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UpdatedBy INT,
        FOREIGN KEY (CreatureId) REFERENCES Creatures (Id),
        FOREIGN KEY (UserId) REFERENCES Users (Id),
        FOREIGN KEY (AddedBy) REFERENCES Users (Id),
        FOREIGN KEY (UpdatedBy) REFERENCES Users (Id)
    );