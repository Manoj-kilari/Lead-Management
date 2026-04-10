const express = require('express');
const router = express.Router();
const agentService = require('../services/agentService');
const { validateAgent, validateAgentPartial } = require('../utils/validation');
const logger = require('../utils/logger');

// Get all agents
router.get('/', async (req, res) => {
  try {
    const agents = await agentService.getAllAgents();
    res.json(agents);
  } catch (error) {
    logger.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const agent = await agentService.getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    logger.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Add new agent
router.post('/', validateAgent, async (req, res) => {
  try {
    const agent = await agentService.createAgent(req.body);
    res.status(201).json(agent);
  } catch (error) {
    logger.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', validateAgentPartial, async (req, res) => {
  try {
    const agent = await agentService.updateAgent(req.params.id, req.body);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    logger.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const result = await agentService.deleteAgent(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    logger.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Get agent statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await agentService.getAgentStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching agent stats:', error);
    res.status(500).json({ error: 'Failed to fetch agent stats' });
  }
});

// Get agent performance
router.get('/:id/performance', async (req, res) => {
  try {
    const performance = await agentService.getAgentPerformance(req.params.id);
    if (!performance) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(performance);
  } catch (error) {
    logger.error('Error fetching agent performance:', error);
    res.status(500).json({ error: 'Failed to fetch agent performance' });
  }
});

module.exports = router;
