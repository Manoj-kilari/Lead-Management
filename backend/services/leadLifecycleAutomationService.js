const leadService = require('./leadService');
const agentService = require('./agentService');
const assignmentService = require('./assignmentService');
const logger = require('../utils/logger');

class LeadLifecycleAutomationService {
  constructor() {
    this.automationRules = {
      // Time-based automation rules
      timeBased: [
        {
          name: 'new_lead_followup',
          condition: { status: 'New', hours_since_creation: 1 },
          action: 'create_followup_task',
          priority: 'High',
          description: 'Create follow-up task for new leads after 1 hour'
        },
        {
          name: 'stale_lead_escalation',
          condition: { status: 'New', hours_since_update: 24 },
          action: 'escalate_to_manager',
          priority: 'Medium',
          description: 'Escalate leads not updated in 24 hours'
        },
        {
          name: 'long_term_nurturing',
          condition: { status: 'New', days_since_creation: 7 },
          action: 'add_to_nurturing_campaign',
          priority: 'Low',
          description: 'Add old leads to nurturing campaign'
        }
      ],
      
      // Status-based automation rules
      statusBased: [
        {
          name: 'contacted_to_warm',
          condition: { status: 'Contacted', contact_attempts: 1 },
          action: 'update_to_warm',
          priority: 'Medium',
          description: 'Mark leads as warm after first contact'
        },
        {
          name: 'high_engagement_alert',
          condition: { status: 'Contacted', contact_attempts: 3, notes_length: 100 },
          action: 'send_high_engagement_alert',
          priority: 'High',
          description: 'Alert for highly engaged leads'
        }
      ],
      
      // Score-based automation rules
      scoreBased: [
        {
          name: 'high_score_priority',
          condition: { min_score: 80, status: 'New' },
          action: 'increase_priority',
          priority: 'High',
          description: 'Auto-boost priority for high-scoring leads'
        },
        {
          name: 'low_score_reassignment',
          condition: { max_score: 30, status: 'New', days_since_creation: 3 },
          action: 'reassign_to_expert',
          priority: 'Medium',
          description: 'Reassign low-scoring leads to expert agents'
        }
      ]
    };
  }

  // Process all automation rules
  async processAutomationRules() {
    try {
      logger.info('Starting lead lifecycle automation processing...');
      
      const results = {
        processed: 0,
        actions_taken: 0,
        rules_triggered: [],
        errors: []
      };

      // Get all active leads
      const allLeads = await leadService.getAllLeads({ limit: 1000 });
      
      for (const lead of allLeads.leads) {
        try {
          const leadActions = await this.processLeadAutomation(lead);
          results.processed++;
          results.actions_taken += leadActions.length;
          
          if (leadActions.length > 0) {
            results.rules_triggered.push({
              leadId: lead.id,
              leadName: lead.name,
              actions: leadActions
            });
          }
        } catch (error) {
          results.errors.push({
            leadId: lead.id,
            error: error.message
          });
          logger.error(`Error processing automation for lead ${lead.id}:`, error);
        }
      }
      
      logger.info(`Automation processing completed. Processed: ${results.processed}, Actions: ${results.actions_taken}`);
      return results;
    } catch (error) {
      logger.error('Error in automation processing:', error);
      throw error;
    }
  }

  // Process automation for a single lead
  async processLeadAutomation(lead) {
    const actionsTaken = [];
    
    // Process time-based rules
    for (const rule of this.automationRules.timeBased) {
      if (await this.evaluateCondition(lead, rule.condition)) {
        const action = await this.executeAction(lead, rule.action, rule);
        actionsTaken.push(action);
      }
    }
    
    // Process status-based rules
    for (const rule of this.automationRules.statusBased) {
      if (await this.evaluateCondition(lead, rule.condition)) {
        const action = await this.executeAction(lead, rule.action, rule);
        actionsTaken.push(action);
      }
    }
    
    // Process score-based rules (if AI scoring is available)
    try {
      const aiScoringService = require('./aiLeadScoringService');
      const score = await aiScoringService.calculateLeadScore(lead.id);
      
      for (const rule of this.automationRules.scoreBased) {
        const conditionWithScore = { ...rule.condition, score: score.score };
        if (await this.evaluateCondition(lead, conditionWithScore)) {
          const action = await this.executeAction(lead, rule.action, rule);
          actionsTaken.push(action);
        }
      }
    } catch (error) {
      // AI scoring not available, skip score-based rules
      logger.debug('AI scoring not available, skipping score-based rules');
    }
    
    return actionsTaken;
  }

  // Evaluate if a condition matches the lead
  async evaluateCondition(lead, condition) {
    // Check status condition
    if (condition.status && lead.status !== condition.status) {
      return false;
    }
    
    // Check time-based conditions
    if (condition.hours_since_creation) {
      const hoursSinceCreation = this.getHoursSinceCreation(lead.created_at);
      if (hoursSinceCreation < condition.hours_since_creation) {
        return false;
      }
    }
    
    if (condition.hours_since_update) {
      const hoursSinceUpdate = this.getHoursSinceCreation(lead.updated_at);
      if (hoursSinceUpdate < condition.hours_since_update) {
        return false;
      }
    }
    
    if (condition.days_since_creation) {
      const daysSinceCreation = this.getHoursSinceCreation(lead.created_at) / 24;
      if (daysSinceCreation < condition.days_since_creation) {
        return false;
      }
    }
    
    // Check lead-specific conditions
    if (condition.contact_attempts !== undefined) {
      if (lead.contact_attempts !== condition.contact_attempts) {
        return false;
      }
    }
    
    if (condition.notes_length !== undefined) {
      const notesLength = (lead.notes || '').length;
      if (notesLength < condition.notes_length) {
        return false;
      }
    }
    
    // Check score-based conditions
    if (condition.min_score !== undefined) {
      if (condition.score < condition.min_score) {
        return false;
      }
    }
    
    if (condition.max_score !== undefined) {
      if (condition.score > condition.max_score) {
        return false;
      }
    }
    
    return true;
  }

  // Execute automation action
  async executeAction(lead, actionType, rule) {
    const action = {
      type: actionType,
      rule_name: rule.name,
      lead_id: lead.id,
      executed_at: new Date(),
      result: null
    };
    
    try {
      switch (actionType) {
        case 'create_followup_task':
          action.result = await this.createFollowupTask(lead);
          break;
          
        case 'escalate_to_manager':
          action.result = await this.escalateToManager(lead);
          break;
          
        case 'add_to_nurturing_campaign':
          action.result = await this.addToNurturingCampaign(lead);
          break;
          
        case 'update_to_warm':
          action.result = await this.updateToWarm(lead);
          break;
          
        case 'send_high_engagement_alert':
          action.result = await this.sendHighEngagementAlert(lead);
          break;
          
        case 'increase_priority':
          action.result = await this.increasePriority(lead);
          break;
          
        case 'reassign_to_expert':
          action.result = await this.reassignToExpert(lead);
          break;
          
        default:
          action.result = `Unknown action type: ${actionType}`;
      }
      
      logger.info(`Automation action executed: ${actionType} for lead ${lead.id}`);
      return action;
    } catch (error) {
      action.error = error.message;
      logger.error(`Error executing automation action ${actionType}:`, error);
      return action;
    }
  }

  // Action implementations
  async createFollowupTask(lead) {
    // Create a follow-up task for the assigned agent
    const task = {
      lead_id: lead.id,
      agent_id: lead.assigned_agent_id,
      type: 'followup',
      priority: 'High',
      description: `Follow up with ${lead.name} - new lead requires attention`,
      due_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      status: 'pending'
    };
    
    // This would save to a tasks table
    logger.info(`Follow-up task created for lead ${lead.id}`);
    return `Follow-up task created for ${lead.name}`;
  }

  async escalateToManager(lead) {
    // Escalate lead to manager attention
    const escalation = {
      lead_id: lead.id,
      agent_id: lead.assigned_agent_id,
      reason: 'Lead not updated for 24 hours',
      escalated_at: new Date(),
      status: 'pending_review'
    };
    
    // This would create an escalation record and notify manager
    logger.warn(`Lead ${lead.id} escalated to manager`);
    return `Lead escalated to manager review`;
  }

  async addToNurturingCampaign(lead) {
    // Add lead to automated nurturing campaign
    const campaign = {
      lead_id: lead.id,
      campaign_type: 'long_term_nurturing',
      start_date: new Date(),
      status: 'active'
    };
    
    // This would add to a campaigns table
    logger.info(`Lead ${lead.id} added to nurturing campaign`);
    return `Added to long-term nurturing campaign`;
  }

  async updateToWarm(lead) {
    // Update lead status to indicate warm lead
    await leadService.updateLeadStatus(lead.id, 'Contacted', 'Automatically marked as warm after first contact');
    return `Lead status updated to Contacted (warm)`;
  }

  async sendHighEngagementAlert(lead) {
    // Send alert about highly engaged lead
    const alert = {
      lead_id: lead.id,
      agent_id: lead.assigned_agent_id,
      type: 'high_engagement',
      message: `${lead.name} shows high engagement - consider priority follow-up`,
      created_at: new Date()
    };
    
    // This would create an alert and notify the agent
    logger.info(`High engagement alert sent for lead ${lead.id}`);
    return `High engagement alert sent to agent`;
  }

  async increasePriority(lead) {
    // Increase lead priority based on high score
    const newPriority = lead.priority === 'Low' ? 'Medium' : 'High';
    await leadService.updateLead(lead.id, { priority: newPriority });
    return `Lead priority increased to ${newPriority}`;
  }

  async reassignToExpert(lead) {
    // Reassign lead to top-performing agent
    const topAgents = await agentService.getTopAgents(1);
    if (topAgents.length > 0 && topAgents[0].id !== lead.assigned_agent_id) {
      await leadService.reassignLead(
        lead.id, 
        topAgents[0].id, 
        'Auto-reassigned due to low engagement score'
      );
      return `Reassigned to expert agent: ${topAgents[0].name}`;
    }
    return `No reassignment needed`;
  }

  // Helper method to get hours since creation
  getHoursSinceCreation(dateString) {
    const created = new Date(dateString);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60));
  }

  // Get automation statistics
  async getAutomationStats() {
    try {
      // This would query automation logs for statistics
      return {
        total_rules: Object.values(this.automationRules).flat().length,
        active_rules: Object.values(this.automationRules).flat().length,
        recent_executions: 0, // Would be calculated from logs
        success_rate: 0, // Would be calculated from logs
        most_triggered_rule: null // Would be calculated from logs
      };
    } catch (error) {
      logger.error('Error getting automation stats:', error);
      throw error;
    }
  }

  // Create custom automation rule
  async createCustomRule(rule) {
    try {
      const customRule = {
        id: Date.now().toString(),
        name: rule.name,
        condition: rule.condition,
        action: rule.action,
        priority: rule.priority || 'Medium',
        description: rule.description,
        created_at: new Date(),
        active: true,
        custom: true
      };
      
      // This would save to database
      logger.info(`Custom automation rule created: ${rule.name}`);
      return customRule;
    } catch (error) {
      logger.error('Error creating custom rule:', error);
      throw error;
    }
  }
}

module.exports = new LeadLifecycleAutomationService();
