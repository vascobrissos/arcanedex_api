const express = require('express'); // Importa o Express para criar rotas
const router = express.Router(); // Cria uma nova instância do router
const adminCreatureController = require('../controllers/adminCreatureController'); // Importa o controlador para gerir criaturas como administrador
const authMiddleware = require('../middleware/authMiddleware'); // Importa o middleware de autenticação

// Middleware para verificar se o utilizador tem o papel de 'Admin'
const roleMiddleware = (req, res, next) => {
    if (req.userRole !== 'Admin') { // Verifica se o papel do utilizador não é 'Admin'
        return res.status(403).json({ error: 'Acesso proibido: Apenas para administradores' }); // Retorna 403 Proibido se não for admin
    }
    next(); // Se o utilizador for admin, prossegue para o próximo middleware ou handler
};

// Rotas protegidas para administradores

// Obter todas as criaturas (apenas para administradores)
router.get(
    '/',
    authMiddleware.verifyToken, // Verifica o token do utilizador
    roleMiddleware, // Verifica se o utilizador é um administrador
    adminCreatureController.getAllCreatures // Controlador para buscar todas as criaturas
);

// Adicionar uma nova criatura (apenas para administradores)
router.post(
    '/',
    authMiddleware.verifyToken, // Verifica o token do utilizador
    roleMiddleware, // Verifica se o utilizador é um administrador
    adminCreatureController.addCreature // Controlador para adicionar uma nova criatura
);

// Editar uma criatura existente pelo ID (apenas para administradores)
router.put(
    '/:id',
    authMiddleware.verifyToken, // Verifica o token do utilizador
    roleMiddleware, // Verifica se o utilizador é um administrador
    adminCreatureController.editCreature // Controlador para editar uma criatura existente
);

// Apagar uma criatura pelo ID (apenas para administradores)
router.delete(
    '/:id',
    authMiddleware.verifyToken, // Verifica o token do utilizador
    roleMiddleware, // Verifica se o utilizador é um administrador
    adminCreatureController.deleteCreature // Controlador para apagar uma criatura
);

module.exports = router; // Exporta o router para ser usado noutras partes da aplicação
