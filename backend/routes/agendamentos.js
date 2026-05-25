// ─────────────────────────────────────────────
// Rotas de Agendamentos — CRUD completo
// ─────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const admin   = require('firebase-admin');

// ── GET /api/agendamentos ─────────────────────
// Retorna todos os agendamentos (admin) ou por cliente
router.get('/', async (req, res) => {
  try {
    const db = require('../server').db;
    const { clienteId, data } = req.query;

    let query = db.collection('agendamentos');

    // Filtra por cliente se informado
    if (clienteId) {
      query = query.where('clienteId', '==', clienteId);
    }

    // Filtra por data se informada
    if (data) {
      query = query.where('data', '==', data);
    }

    const snapshot = await query.orderBy('horario').get();

    const agendamentos = [];
    snapshot.forEach(doc => {
      agendamentos.push({ id: doc.id, ...doc.data() });
    });

    res.json(agendamentos);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── GET /api/agendamentos/:id ─────────────────
// Retorna um agendamento específico pelo ID
router.get('/:id', async (req, res) => {
  try {
    const db  = require('../server').db;
    const doc = await db.collection('agendamentos')
                        .doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── POST /api/agendamentos ────────────────────
// Cria um novo agendamento
router.post('/', async (req, res) => {
  const {
    clienteId,
    profissionalId,
    servicoId,
    data,
    horario,
    observacoes
  } = req.body;

  try {
    const db = require('../server').db;

    // Verifica se o horário já está ocupado para o profissional
    const conflito = await db.collection('agendamentos')
      .where('profissionalId', '==', profissionalId)
      .where('data',           '==', data)
      .where('horario',        '==', horario)
      .where('status',         'in', ['pendente', 'confirmado'])
      .get();

    if (!conflito.empty) {
      return res.status(409).json({
        erro: 'Horário indisponível. Escolha outro horário.'
      });
    }

    // Cria o agendamento no Firestore
    const ref = await db.collection('agendamentos').add({
      clienteId,
      profissionalId,
      servicoId,
      data,
      horario,
      status:      'pendente',
      observacoes: observacoes || '',
      criadoEm:   admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      mensagem: 'Agendamento criado com sucesso!',
      id: ref.id
    });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── PUT /api/agendamentos/:id/status ──────────
// Atualiza o status de um agendamento (admin)
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['pendente', 'confirmado', 'cancelado', 'concluido'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  try {
    const db = require('../server').db;
    await db.collection('agendamentos').doc(req.params.id).update({
      status
    });

    res.json({ mensagem: `Agendamento ${status} com sucesso!` });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// ── DELETE /api/agendamentos/:id ──────────────
// Cancela um agendamento
router.delete('/:id', async (req, res) => {
  try {
    const db = require('../server').db;
    await db.collection('agendamentos').doc(req.params.id).update({
      status: 'cancelado'
    });

    res.json({ mensagem: 'Agendamento cancelado com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

module.exports = router;
