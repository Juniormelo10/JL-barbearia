// ─────────────────────────────────────────────
// Arquivo principal do servidor — JL Barbearia
// ─────────────────────────────────────────────

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const admin      = require('firebase-admin');

// Inicializa o servidor Express
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Inicializa o Firebase Admin SDK ──────────
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Exporta o Firestore para uso nas rotas
const db = admin.firestore();
module.exports.db = db;

// ── Middlewares globais ───────────────────────
// Permite requisições de outras origens (frontend)
app.use(cors());

// Permite receber JSON no corpo das requisições
app.use(express.json());

// ── Rotas da API ──────────────────────────────
// Cada arquivo de rota cuida de um recurso do sistema
const authRoutes          = require('./routes/auth');
const agendamentosRoutes  = require('./routes/agendamentos');
const servicosRoutes      = require('./routes/servicos');
const profissionaisRoutes = require('./routes/profissionais');

app.use('/api/auth',          authRoutes);
app.use('/api/agendamentos',  agendamentosRoutes);
app.use('/api/servicos',      servicosRoutes);
app.use('/api/profissionais', profissionaisRoutes);

// ── Rota de teste ─────────────────────────────
// Acesse http://localhost:3000/ para confirmar que o servidor está rodando
app.get('/', (req, res) => {
  res.json({ 
    mensagem: 'Servidor JL Barbearia rodando com sucesso!',
    versao: '1.0.0'
  });
});

// ── Inicia o servidor ─────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🔗 Acesse: http://localhost:${PORT}`);
});