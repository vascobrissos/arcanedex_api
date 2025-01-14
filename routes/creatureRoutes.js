const express = require('express'); // Importa o Express para criar rotas
const router = express.Router(); // Cria uma nova instância de router
const creatureController = require('../controllers/creatureController'); // Importa o controlador de criaturas
const authMiddleware = require('../middleware/authMiddleware'); // Importa o middleware de autenticação

// Rotas Públicas
// (Adicione aqui se tiver rotas que não exigem autenticação)

// Rotas Protegidas (Requerem Autenticação)

// Obter todas as criaturas
router.get('/',
    authMiddleware.verifyToken, // Middleware para verificar o token do utilizador
    creatureController.getAllCreatures // Controlador para buscar todas as criaturas
);

// Obter detalhes de uma criatura específica pelo ID
router.get('/:id',
    authMiddleware.verifyToken, // Middleware para verificar o token do utilizador
    creatureController.getCreatureDetails // Controlador para buscar os detalhes de uma criatura específica
);

// Adicionar uma criatura aos favoritos do utilizador
router.post(
    '/favourites',
    authMiddleware.verifyToken, // Middleware para verificar o token do utilizador
    creatureController.addCreatureToFavourites // Controlador para adicionar uma criatura aos favoritos
);

// Remover uma criatura dos favoritos do utilizador pelo ID
router.delete(
    '/favourites/:id',
    authMiddleware.verifyToken, // Middleware para verificar o token do utilizador
    creatureController.removeCreatureFromFavourites // Controlador para remover uma criatura dos favoritos pelo ID
);

// Atualizar a imagem de fundo de uma criatura favorita
router.put(
    '/favourites/:id/background',
    authMiddleware.verifyToken, // Middleware para verificar o token do utilizador
    creatureController.changeFavouriteCreatureBackground // Controlador para atualizar a imagem de fundo de uma criatura favorita
);

// Repor a imagem de fundo de uma criatura favorita para o padrão
router.put(
    '/favourites/:id/background/default',
    authMiddleware.verifyToken, // Middleware para verificar o token do utilizador
    creatureController.changeFavouriteCreatureBackgroundToDefault // Controlador para repor a imagem de fundo para o padrão
);

module.exports = router; // Exporta o router para ser usado noutras partes da aplicação
