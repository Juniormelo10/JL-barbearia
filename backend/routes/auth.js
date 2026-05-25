// ─────────────────────────────────────────────
// Rotas de autenticação — Login e Registro
// ─────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const admin   = require('firebase-admin');
const jwt     = require('jsonwebtoken');

// ── POST /api/auth/registro ───────────────────
// Cria um novo usuário no Firebase Authentication
router.post('/registro', async (req, res) => {
  const { nome, email, senha, telefone } = req.body;

  try {
    // Cria o usuário no Firebase Authentication
    const usuario = await admin.auth().createUser({
      email,
      password: senha,
      displayName: nome
    });

    // Salva os dados extras no Firestore
    const db = require('../server').db;
    await db.collection('usuarios').doc(usuario.uid).set({
      nome,
      email,
      telefone: telefone || '',
      perfil: 'cliente',
      criadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      mensagem: 'Usuário criado com sucesso!',
      uid: usuario.uid 
    });

  } catch (erro) {
    res.status(400).json({ erro: erro.message });
  }
});

// ── POST /api/auth/login ──────────────────────
// Valida o token do Firebase e retorna um JWT próprio
router.post('/login', async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verifica o token enviado pelo frontend via Firebase Auth
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Busca o perfil do usuário no Firestore
    const db = require('../server').db;
    const doc = await db.collection('usuarios').doc(decoded.uid).get();

    if (!doc.exists) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const dados = doc.data();

    // Gera o token JWT com os dados do usuário
    const token = jwt.sign(
      { 
        uid:    decoded.uid, 
        email:  dados.email, 
        perfil: dados.perfil 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      perfil: dados.perfil, 
      nome:   dados.nome 
    });

  } catch (erro) {
    res.status(401).json({ erro: 'Token inválido.' });
  }
});

module.exports = router;
