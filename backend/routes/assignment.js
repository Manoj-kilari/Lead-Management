const express = require('express');
const router = express.Router();
const assignmentService = require('../services/assignmentService');
const schedulerService = require('../services/schedulerService');
const logger = require('../utils/logger');

// Get assignment statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await assignmentService.getAssignmentStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching assignment stats:', error);
    res.status(500).json({ error: 'Failed to fetch assignment stats' });
  }
});

// Get agent capacity report
router.get('/capacity', async (req, res) => {
  try {
    const capacity = await assignmentService.checkAgentCapacity();
    res.json(capacity);
  } catch (error) {
    logger.error('Error fetching agent capacity:', error);
    res.status(500).json({ error: 'Failed to fetch agent capacity' });
  }
});

// Manual lead assignment with advanced logic
router.post('/assign', async (req, res) => {
  try {
    const { leadId, source, priority } = req.body;
    
    if (!leadId || !source || !priority) {
      return res.status(400).json({ error: 'Lead ID, source, and priority are required' });
    }
    
    const assignedAgent = await assignmentService.assignLeadWithAdvancedLogic({
      source,
      priority
    });
    
    if (!assignedAgent) {
      return res.status(404).json({ error: 'No suitable agent found for assignment' });
    }
    
    // Reassign the lead
    const leadService = require('../services/leadService');
    const updatedLead = await leadService.reassignLead(
      leadId,
      assignedAgent.id,
      `Manual assignment: ${assignedAgent.assignment_reason}`
    );
    
    res.json({
      lead: updatedLead,
      agent: assignedAgent,
      assignment_reason: assignedAgent.assignment_reason
    });
  } catch (error) {
    logger.error('Error in manual lead assignment:', error);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
});

// Reassign stale leads manually
router.post('/reassign-stale', async (req, res) => {
  try {
    const result = await assignmentService.reassignStaleLeads();
    res.json(result);
  } catch (error) {
    logger.error('Error reassigning stale leads:', error);
    res.status(500).json({ error: 'Failed to reassign stale leads' });
  }
});

// Process auto Lost status manually
router.post('/process-lost', async (req, res) => {
  try {
    const result = await assignmentService.processAutoLostLeads();
    res.json(result);
  } catch (error) {
    logger.error('Error processing auto Lost status:', error);
    res.status(500).json({ error: 'Failed to process auto Lost status' });
  }
});

// Rebalance leads manually
router.post('/rebalance', async (req, res) => {
  try {
    await assignmentService.rebalanceLeads();
    res.json({ message: 'Lead rebalancing completed successfully' });
  } catch (error) {
    logger.error('Error rebalancing leads:', error);
    res.status(500).json({ error: 'Failed to rebalance leads' });
  }
});

// Run all scheduler tasks manually
router.post('/run-tasks', async (req, res) => {
  try {
    const results = await schedulerService.runAllTasks();
    res.json(results);
  } catch (error) {
    logger.error('Error running scheduler tasks:', error);
    res.status(500).json({ error: 'Failed to run scheduler tasks' });
  }
});

// Get scheduler status
router.get('/scheduler/status', async (req, res) => {
  try {
    const status = schedulerService.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error fetching scheduler status:', error);
    res.status(500).json({ error: 'Failed to fetch scheduler status' });
  }
});

// Start scheduler
router.post('/scheduler/start', async (req, res) => {
  try {
    schedulerService.start();
    res.json({ message: 'Scheduler started successfully' });
  } catch (error) {
    logger.error('Error starting scheduler:', error);
    res.status(500).json({ error: 'Failed to start scheduler' });
  }
});

// Stop scheduler
router.post('/scheduler/stop', async (req, res) => {
  try {
    schedulerService.stop();
    res.json({ message: 'Scheduler stopped successfully' });
  } catch (error) {
    logger.error('Error stopping scheduler:', error);
    res.status(500).json({ error: 'Failed to stop scheduler' });
  }
});

module.exports = router;
