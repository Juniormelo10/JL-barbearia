// ─────────────────────────────────────────────
// Rotas de Profissionais — CRUD completo
// ─────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const admin   = require('firebase-admin');

// ── GET /api/profissionais ────────────────────
// Retorna todos os profissionais ativos
router.get('/', async (req, res) => {
  try {
    const db       = require('../server').db;
    const snapshot = await db.collection('profissionais')
                             .where('ativo', '==', true)
                             .get();

    const profissionais = [];
    snapshot.forEach(doc => {
      profissionais.push({ id: doc.id, ...doc.data() });
    });

    res.json(profissionais);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── GET /api/profissionais/:id ────────────────
// Retorna um profissional específico pelo ID
router.get('/:id', async (req, res) => {
  try {
    const db  = require('../server').db;
    const doc = await db.collection('profissionais')
                        .doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ erro: 'Profissional não encontrado.' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── POST /api/profissionais ───────────────────
// Cadastra um novo profissional (somente admin)
router.post('/', async (req, res) => {
  const { nome, especialidade, foto } = req.body;

  try {
    const db  = require('../server').db;
    const ref = await db.collection('profissionais').add({
      nome,
      especialidade,
      foto:     foto || '',
      ativo:    true,
      criadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      mensagem: 'Profissional cadastrado com sucesso!', 
      id: ref.id 
    });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── PUT /api/profissionais/:id ────────────────
// Atualiza os dados de um profissional existente
router.put('/:id', async (req, res) => {
  const { nome, especialidade, foto, ativo } = req.body;

  try {
    const db = require('../server').db;
    await db.collection('profissionais').doc(req.params.id).update({
      nome,
      especialidade,
      foto:  foto || '',
      ativo
    });

    res.json({ mensagem: 'Profissional atualizado com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── DELETE /api/profissionais/:id ─────────────
// Desativa um profissional (não exclui do banco)
router.delete('/:id', async (req, res) => {
  try {
    const db = require('../server').db;
    await db.collection('profissionais').doc(req.params.id).update({
      ativo: false
    });

    res.json({ mensagem: 'Profissional desativado com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

module.exports = router;
