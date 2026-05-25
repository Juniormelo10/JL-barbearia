// ─────────────────────────────────────────────
// Rotas de Serviços — CRUD completo
// ─────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const admin   = require('firebase-admin');

// ── GET /api/servicos ─────────────────────────
// Retorna todos os serviços ativos da barbearia
router.get('/', async (req, res) => {
  try {
    const db      = require('../server').db;
    const snapshot = await db.collection('servicos')
                             .where('ativo', '==', true)
                             .get();

    const servicos = [];
    snapshot.forEach(doc => {
      servicos.push({ id: doc.id, ...doc.data() });
    });

    res.json(servicos);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── GET /api/servicos/:id ─────────────────────
// Retorna um serviço específico pelo ID
router.get('/:id', async (req, res) => {
  try {
    const db  = require('../server').db;
    const doc = await db.collection('servicos').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ erro: 'Serviço não encontrado.' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── POST /api/servicos ────────────────────────
// Cadastra um novo serviço (somente admin)
router.post('/', async (req, res) => {
  const { nome, descricao, preco, duracaoMinutos } = req.body;

  try {
    const db  = require('../server').db;
    const ref = await db.collection('servicos').add({
      nome,
      descricao,
      preco:          Number(preco),
      duracaoMinutos: Number(duracaoMinutos),
      ativo:          true,
      criadoEm:       admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      mensagem: 'Serviço cadastrado com sucesso!', 
      id: ref.id 
    });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── PUT /api/servicos/:id ─────────────────────
// Atualiza os dados de um serviço existente
router.put('/:id', async (req, res) => {
  const { nome, descricao, preco, duracaoMinutos, ativo } = req.body;

  try {
    const db = require('../server').db;
    await db.collection('servicos').doc(req.params.id).update({
      nome,
      descricao,
      preco:          Number(preco),
      duracaoMinutos: Number(duracaoMinutos),
      ativo
    });

    res.json({ mensagem: 'Serviço atualizado com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── DELETE /api/servicos/:id ──────────────────
// Desativa um serviço (não exclui do banco)
router.delete('/:id', async (req, res) => {
  try {
    const db = require('../server').db;
    await db.collection('servicos').doc(req.params.id).update({
      ativo: false
    });

    res.json({ mensagem: 'Serviço desativado com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

module.exports = router;
