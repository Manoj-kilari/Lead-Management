const express = require('express');
const router = express.Router();
const aiScoringService = require('../services/aiLeadScoringService');
const gamificationService = require('../services/gamificationService');
const automationService = require('../services/leadLifecycleAutomationService');
const logger = require('../utils/logger');

// AI Lead Scoring Routes
router.get('/scoring/lead/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const score = await aiScoringService.calculateLeadScore(parseInt(leadId));
    res.json(score);
  } catch (error) {
    logger.error('Error calculating lead score:', error);
    res.status(500).json({ error: 'Failed to calculate lead score' });
  }
});

router.get('/scoring/all', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const scores = await aiScoringService.scoreAllLeads();
    res.json(scores.slice(0, parseInt(limit)));
  } catch (error) {
    logger.error('Error scoring all leads:', error);
    res.status(500).json({ error: 'Failed to score all leads' });
  }
});

router.get('/scoring/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topLeads = await aiScoringService.getTopScoringLeads(parseInt(limit));
    res.json(topLeads);
  } catch (error) {
    logger.error('Error getting top scoring leads:', error);
    res.status(500).json({ error: 'Failed to get top scoring leads' });
  }
});

router.get('/prediction/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const prediction = await aiScoringService.predictConversionProbability(parseInt(leadId));
    res.json(prediction);
  } catch (error) {
    logger.error('Error predicting conversion probability:', error);
    res.status(500).json({ error: 'Failed to predict conversion probability' });
  }
});

// Gamification Routes
router.get('/gamification/leaderboard', async (req, res) => {
  try {
    const { type = 'weekly', limit = 10 } = req.query;
    const leaderboard = await gamificationService.getLeaderboard(type, parseInt(limit));
    res.json(leaderboard);
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

router.get('/gamification/agent/:agentId/score', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { type = 'weekly' } = req.query;
    const score = await gamificationService.calculateAgentScore(parseInt(agentId), type);
    res.json(score);
  } catch (error) {
    logger.error('Error calculating agent score:', error);
    res.status(500).json({ error: 'Failed to calculate agent score' });
  }
});

router.get('/gamification/agent/:agentId/achievements', async (req, res) => {
  try {
    const { agentId } = req.params;
    const achievements = await gamificationService.getAgentAchievements(parseInt(agentId));
    res.json(achievements);
  } catch (error) {
    logger.error('Error getting agent achievements:', error);
    res.status(500).json({ error: 'Failed to get agent achievements' });
  }
});

router.get('/gamification/team-stats', async (req, res) => {
  try {
    const stats = await gamificationService.getTeamStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting team stats:', error);
    res.status(500).json({ error: 'Failed to get team stats' });
  }
});

router.post('/gamification/competition', async (req, res) => {
  try {
    const { name, duration, type } = req.body;
    const competition = await gamificationService.createCompetition(name, duration, type);
    res.status(201).json(competition);
  } catch (error) {
    logger.error('Error creating competition:', error);
    res.status(500).json({ error: 'Failed to create competition' });
  }
});

router.post('/gamification/achievement/:agentId/:achievementKey', async (req, res) => {
  try {
    const { agentId, achievementKey } = req.params;
    const achievement = await gamificationService.awardAchievement(parseInt(agentId), achievementKey);
    res.json(achievement);
  } catch (error) {
    logger.error('Error awarding achievement:', error);
    res.status(500).json({ error: 'Failed to award achievement' });
  }
});

// Automation Routes
router.post('/automation/process', async (req, res) => {
  try {
    const results = await automationService.processAutomationRules();
    res.json(results);
  } catch (error) {
    logger.error('Error processing automation rules:', error);
    res.status(500).json({ error: 'Failed to process automation rules' });
  }
});

router.get('/automation/stats', async (req, res) => {
  try {
    const stats = await automationService.getAutomationStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting automation stats:', error);
    res.status(500).json({ error: 'Failed to get automation stats' });
  }
});

router.post('/automation/rules', async (req, res) => {
  try {
    const rule = req.body;
    const customRule = await automationService.createCustomRule(rule);
    res.status(201).json(customRule);
  } catch (error) {
    logger.error('Error creating custom rule:', error);
    res.status(500).json({ error: 'Failed to create custom rule' });
  }
});

// Combined AI Dashboard Data
router.get('/dashboard/ai-insights', async (req, res) => {
  try {
    const [topLeads, leaderboard, teamStats, automationStats] = await Promise.all([
      aiScoringService.getTopScoringLeads(5),
      gamificationService.getLeaderboard('weekly', 5),
      gamificationService.getTeamStats(),
      automationService.getAutomationStats()
    ]);
    
    const insights = {
      top_scoring_leads: topLeads,
      leaderboard: leaderboard,
      team_stats: teamStats,
      automation_stats: automationStats,
      generated_at: new Date()
    };
    
    res.json(insights);
  } catch (error) {
    logger.error('Error getting AI insights:', error);
    res.status(500).json({ error: 'Failed to get AI insights' });
  }
});

module.exports = router;
