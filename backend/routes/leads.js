const express = require('express');
const router = express.Router();
const leadService = require('../services/leadService');
const { validateLead } = require('../utils/validation');
const logger = require('../utils/logger');

// Get all leads
router.get('/', async (req, res) => {
  try {
    const { status, priority, source, agent_id, page = 1, limit = 50 } = req.query;
    const leads = await leadService.getAllLeads({ 
      status, 
      priority, 
      source, 
      agent_id, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    res.json(leads);
  } catch (error) {
    logger.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get lead by ID
router.get('/:id', async (req, res) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    logger.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Create new lead
router.post('/', validateLead, async (req, res) => {
  try {
    const io = req.app.get('io');
    const lead = await leadService.createLead(req.body, io);
    res.status(201).json(lead);
  } catch (error) {
    logger.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update lead
router.put('/:id', validateLead, async (req, res) => {
  try {
    const io = req.app.get('io');
    const lead = await leadService.updateLead(req.params.id, req.body, io);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    logger.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const result = await leadService.deleteLead(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    logger.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Update lead status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const io = req.app.get('io');
    const lead = await leadService.updateLeadStatus(req.params.id, status, notes, io);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    logger.error('Error updating lead status:', error);
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// Record contact attempt
router.post('/:id/contact', async (req, res) => {
  try {
    const { notes, successful } = req.body;
    const io = req.app.get('io');
    const lead = await leadService.recordContactAttempt(req.params.id, notes, successful, io);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    logger.error('Error recording contact attempt:', error);
    res.status(500).json({ error: 'Failed to record contact attempt' });
  }
});

// Reassign lead
router.patch('/:id/reassign', async (req, res) => {
  try {
    const { agent_id, reason } = req.body;
    const io = req.app.get('io');
    const lead = await leadService.reassignLead(req.params.id, agent_id, reason, io);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    logger.error('Error reassigning lead:', error);
    res.status(500).json({ error: 'Failed to reassign lead' });
  }
});

// Get lead statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await leadService.getLeadStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching lead stats:', error);
    res.status(500).json({ error: 'Failed to fetch lead stats' });
  }
});

// Get lead history
router.get('/:id/history', async (req, res) => {
  try {
    const history = await leadService.getLeadHistory(req.params.id);
    res.json(history);
  } catch (error) {
    logger.error('Error fetching lead history:', error);
    res.status(500).json({ error: 'Failed to fetch lead history' });
  }
});

module.exports = router;
