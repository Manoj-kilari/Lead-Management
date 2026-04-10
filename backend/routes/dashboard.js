const express = require('express');
const router = express.Router();
const leadService = require('../services/leadService');
const agentService = require('../services/agentService');
const assignmentService = require('../services/assignmentService');
const logger = require('../utils/logger');

// Get comprehensive dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get lead statistics
    const leadStats = await leadService.getLeadStats();
    
    // Get agent statistics
    const agentStats = await assignmentService.getAssignmentStats();
    
    // Get agent capacity report
    const capacityReport = await assignmentService.checkAgentCapacity();
    
    // Get recent leads (last 5)
    const recentLeads = await leadService.getAllLeads({ page: 1, limit: 5 });
    
    // Get top performing agents
    const topAgents = await agentService.getTopAgents(3);
    
    // Get stale leads count
    const staleLeads = await leadService.getStaleLeads(2);
    
    // Get agents needing attention (overloaded or inactive)
    const agentsNeedingAttention = capacityReport.filter(agent => 
      agent.is_overloaded || !agent.is_active
    );

    const dashboardStats = {
      overview: {
        total_leads: leadStats.total_leads,
        new_leads: leadStats.new_leads,
        contacted_leads: leadStats.contacted_leads,
        converted_leads: leadStats.converted_leads,
        lost_leads: leadStats.lost_leads,
        high_priority_leads: leadStats.high_priority_leads,
        unassigned_leads: leadStats.unassigned_leads
      },
      agents: {
        total_agents: agentStats.total_agents,
        active_agents: agentStats.active_agents,
        agents_with_leads: agentStats.agents_with_leads,
        average_leads_per_agent: agentStats.average_leads_per_agent,
        total_active_leads: agentStats.total_active_leads
      },
      performance: {
        top_performers: topAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          converted_leads: agent.converted_leads,
          active_leads: agent.active_leads_count,
          conversion_rate: agent.active_leads_count > 0 
            ? ((agent.converted_leads / (agent.active_leads_count + agent.converted_leads)) * 100).toFixed(1)
            : 0
        })),
        agents_needing_attention: agentsNeedingAttention.map(agent => ({
          id: agent.id,
          name: agent.name,
          current_load: agent.current_load,
          issue: agent.is_overloaded ? 'Overloaded' : 'Inactive',
          can_handle_facebook: agent.facebook_capable
        }))
      },
      alerts: {
        stale_leads_count: staleLeads.length,
        unassigned_leads_count: leadStats.unassigned_leads,
        high_priority_unassigned: leadStats.high_priority_leads - (agentStats.total_active_leads > 0 ? 1 : 0),
        agents_overloaded: capacityReport.filter(agent => agent.is_overloaded).length
      },
      recent_activity: {
        recent_leads: recentLeads.leads.map(lead => ({
          id: lead.id,
          name: lead.name,
          source: lead.source,
          priority: lead.priority,
          status: lead.status,
          agent_name: lead.agent_name,
          created_at: lead.created_at
        }))
      }
    };

    res.json(dashboardStats);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get lead status distribution
router.get('/lead-status-distribution', async (req, res) => {
  try {
    const leadStats = await leadService.getLeadStats();
    
    const distribution = [
      { status: 'New', count: leadStats.new_leads, percentage: leadStats.total_leads > 0 ? ((leadStats.new_leads / leadStats.total_leads) * 100).toFixed(1) : 0 },
      { status: 'Contacted', count: leadStats.contacted_leads, percentage: leadStats.total_leads > 0 ? ((leadStats.contacted_leads / leadStats.total_leads) * 100).toFixed(1) : 0 },
      { status: 'Converted', count: leadStats.converted_leads, percentage: leadStats.total_leads > 0 ? ((leadStats.converted_leads / leadStats.total_leads) * 100).toFixed(1) : 0 },
      { status: 'Lost', count: leadStats.lost_leads, percentage: leadStats.total_leads > 0 ? ((leadStats.lost_leads / leadStats.total_leads) * 100).toFixed(1) : 0 }
    ];

    res.json(distribution);
  } catch (error) {
    logger.error('Error fetching lead status distribution:', error);
    res.status(500).json({ error: 'Failed to fetch lead status distribution' });
  }
});

// Get lead source distribution
router.get('/lead-source-distribution', async (req, res) => {
  try {
    const sql = `
      SELECT source, COUNT(*) as count
      FROM leads
      GROUP BY source
      ORDER BY count DESC
    `;
    
    const results = await require('../config/database').query(sql);
    const total = results.reduce((sum, row) => sum + row.count, 0);
    
    const distribution = results.map(row => ({
      source: row.source,
      count: row.count,
      percentage: total > 0 ? ((row.count / total) * 100).toFixed(1) : 0
    }));

    res.json(distribution);
  } catch (error) {
    logger.error('Error fetching lead source distribution:', error);
    res.status(500).json({ error: 'Failed to fetch lead source distribution' });
  }
});

// Get agent workload distribution
router.get('/agent-workload-distribution', async (req, res) => {
  try {
    const agents = await agentService.getAllAgents();
    
    const workloadDistribution = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      active_leads: agent.active_leads_count,
      is_active: agent.is_active,
      can_handle_facebook: agent.can_handle_facebook,
      workload_percentage: agents.length > 0 ? ((agent.active_leads_count / agents.reduce((sum, a) => sum + a.active_leads_count, 0)) * 100).toFixed(1) : 0
    })).sort((a, b) => b.active_leads - a.active_leads);

    res.json(workloadDistribution);
  } catch (error) {
    logger.error('Error fetching agent workload distribution:', error);
    res.status(500).json({ error: 'Failed to fetch agent workload distribution' });
  }
});

// Get conversion trends (last 7 days)
router.get('/conversion-trends', async (req, res) => {
  try {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_leads,
        SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) as converted_leads
      FROM leads 
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const results = await require('../config/database').query(sql);
    
    const trends = results.map(row => ({
      date: row.date,
      total_leads: row.total_leads,
      converted_leads: row.converted_leads,
      conversion_rate: row.total_leads > 0 ? ((row.converted_leads / row.total_leads) * 100).toFixed(1) : 0
    }));

    res.json(trends);
  } catch (error) {
    logger.error('Error fetching conversion trends:', error);
    res.status(500).json({ error: 'Failed to fetch conversion trends' });
  }
});

module.exports = router;
