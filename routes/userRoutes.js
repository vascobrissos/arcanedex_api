const express = require('express'); // Importa o Express para criar rotas
const router = express.Router(); // Cria uma nova instância de router
const userController = require('../controllers/userController'); // Importa o controlador de utilizadores
const authMiddleware = require('../middleware/authMiddleware'); // Importa o middleware de autenticação

// Rotas Públicas

// Registar um novo utilizador
router.post('/register', userController.registerUser);
// Permite que novos utilizadores criem uma conta fornecendo os dados necessários (e.g., nome de utilizador, palavra-passe, email).

// Iniciar sessão para um utilizador existente
router.post('/login', userController.loginUser);
// Permite que utilizadores existentes façam login com as suas credenciais e recebam um token JWT.

// Rotas Protegidas (Requerem Autenticação)

// Obter o perfil do utilizador atualmente autenticado
router.get(
    '/profile',
    authMiddleware.verifyToken, // Middleware para verificar o token JWT
    userController.getUserProfile // Recupera o perfil do utilizador (excluindo informações sensíveis, como a palavra-passe).
);

// Eliminar a conta do utilizador autenticado
router.delete(
    '/deleteAccount',
    authMiddleware.verifyToken, // Middleware para verificar o token JWT
    userController.deleteUserAccount // Controlador para eliminar a conta do utilizador.
);

// Atualizar o perfil do utilizador autenticado (exceto o nome de utilizador)
router.put(
    '/profile',
    authMiddleware.verifyToken, // Middleware para verificar o token JWT
    userController.updateUser // Controlador para atualizar os dados do utilizador.
);
// Permite que utilizadores autenticados atualizem os seus dados (e.g., email, nome, palavra-passe) enquanto mantêm o nome de utilizador inalterado.

// Exportar o router para ser utilizado noutras partes da aplicação
module.exports = router;
