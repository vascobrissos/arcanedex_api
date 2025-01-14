const jwt = require('jsonwebtoken'); // Importa a biblioteca JSON Web Token para verificação de tokens
require('dotenv').config(); // Carrega variáveis de ambiente do ficheiro .env para process.env

// Middleware para verificar o token JWT na requisição
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Obtém o cabeçalho Authorization da requisição
    if (!authHeader) return res.status(401).json({ error: 'Token ausente' }); // Se o cabeçalho Authorization estiver ausente, retorna 401 (Não autorizado)

    const token = authHeader.split(' ')[1]; // Extrai a parte do token (assumindo o formato "Bearer <token>")
    if (!token) return res.status(401).json({ error: 'Token ausente' }); // Se o token estiver ausente, retorna 401 (Não autorizado)

    // Verifica o token utilizando a chave secreta
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token inválido' }); // Se a verificação falhar, retorna 401 (Não autorizado)

        req.userId = decoded.id; // Anexa o ID do utilizador (do payload do token) ao objeto da requisição
        req.userRole = decoded.role; // Anexa o papel do utilizador (role) ao objeto da requisição
        next(); // Prossegue para o próximo middleware ou handler da rota
    });
};
