const express = require('express'); // Importa o Express para criar o servidor
const bodyParser = require('body-parser'); // Importa o body-parser para processar os corpos das requisições
const cors = require('cors'); // Importa o CORS para lidar com partilha de recursos entre origens diferentes

const userRoutes = require('./routes/userRoutes'); // Importa as rotas relacionadas com os utilizadores
const creatureRoutes = require('./routes/creatureRoutes'); // Importa as rotas relacionadas com criaturas
const adminCreatureRoutes = require('./routes/adminCreatureRoutes'); // Importa as rotas de administração de criaturas

const app = express(); // Inicializa a aplicação Express

// Configurar body-parser para suportar tamanhos maiores de dados
app.use(bodyParser.json({ limit: '15mb' })); // Permite até 15 MB para o corpo das requisições em JSON
app.use(bodyParser.urlencoded({ limit: '15mb', extended: true })); // Permite até 15 MB para dados URL-encoded

// Middleware

// Processa corpos de requisições JSON
app.use(bodyParser.json());

// Ativa o CORS para permitir requisições de origens diferentes
app.use(cors());

// Rotas

// Rotas relacionadas com utilizadores (e.g., registo, login, perfil de utilizador)
app.use('/users', userRoutes);

// Rotas públicas e relacionadas com criaturas do utilizador (e.g., visualizar criaturas, gerir favoritos)
app.use('/creatures', creatureRoutes);

// Rotas específicas para administração de criaturas (e.g., gerir criaturas como administrador)
app.use('/admin/creatures', adminCreatureRoutes);

// Iniciar o servidor

const PORT = process.env.PORT || 3000; // Usa a variável de ambiente PORT ou, por defeito, o porto 3000
app.listen(PORT, () => {
    console.log(`Servidor em execução no porto ${PORT}`); // Loga que o servidor está em execução e em que porto
});
