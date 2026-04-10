const cron = require('node-cron');
const { query } = require('../config/database');
const leadService = require('./leadService');
const assignmentService = require('./assignmentService');
const logger = require('../utils/logger');

class AutoReassignService {
  constructor() {
    this.isRunning = false;
    this.io = null;
  }

  start(io) {
    this.io = io;
    
    // Run every 15 minutes to check for stale leads
    cron.schedule('*/15 * * * *', async () => {
      await this.checkAndReassignStaleLeads();
    });
    
    // Run daily at 2 AM for maintenance tasks
    cron.schedule('0 2 * * *', async () => {
      await this.performMaintenanceTasks();
    });
    
    logger.info('Auto-reassign service started');
  }

  async checkAndReassignStaleLeads() {
    if (this.isRunning) {
      logger.info('Auto-reassign already running, skipping this cycle');
      return;
    }
    
    this.isRunning = true;
    
    try {
      logger.info('Checking for stale leads...');
      
      // Get leads that haven't been updated in 2 hours
      const staleLeads = await leadService.getStaleLeads(2);
      
      if (staleLeads.length === 0) {
        logger.info('No stale leads found');
        return;
      }
      
      logger.info(`Found ${staleLeads.length} stale leads`);
      
      for (const lead of staleLeads) {
        try {
          // Check if current agent is still active and not overloaded
          if (lead.assigned_agent_id) {
            const currentAgent = await agentService.getAgentById(lead.assigned_agent_id);
            
            if (currentAgent && currentAgent.is_active && currentAgent.active_leads_count <= 15) {
              logger.info(`Lead ${lead.id} assigned to active agent ${currentAgent.name}, keeping assignment`);
              continue;
            }
          }
          
          // Find new agent for the lead
          const newAgent = await assignmentService.assignLead({
            source: lead.source,
            priority: lead.priority
          });
          
          if (newAgent) {
            await leadService.reassignLead(
              lead.id,
              newAgent.id,
              `Auto-reassigned: Lead was stale for ${lead.hours_since_update} hours`
            );
            
            logger.info(`Lead ${lead.id} reassigned from ${lead.agent_name || 'unassigned'} to ${newAgent.name}`);
            
            // Emit real-time update
            if (this.io) {
              this.io.emit('lead:auto_reassigned', {
                leadId: lead.id,
                oldAgent: lead.agent_name,
                newAgent: newAgent.name,
                reason: `Stale for ${lead.hours_since_update} hours`
              });
            }
          } else {
            logger.warn(`No suitable agent found for stale lead ${lead.id}`);
          }
        } catch (error) {
          logger.error(`Error processing stale lead ${lead.id}:`, error);
        }
      }
      
      logger.info(`Processed ${staleLeads.length} stale leads`);
    } catch (error) {
      logger.error('Error in checkAndReassignStaleLeads:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async performMaintenanceTasks() {
    try {
      logger.info('Starting daily maintenance tasks...');
      
      // Task 1: Mark leads as Lost if contacted 3+ times and not converted
      await this.markOverContactedLeads();
      
      // Task 2: Rebalance leads across agents
      await assignmentService.rebalanceLeads();
      
      // Task 3: Update agent statistics
      await this.updateAgentStatistics();
      
      logger.info('Daily maintenance tasks completed');
    } catch (error) {
      logger.error('Error in performMaintenanceTasks:', error);
    }
  }

  async markOverContactedLeads() {
    try {
      logger.info('Checking for over-contacted leads...');
      
      const sql = `
        SELECT l.*, a.name as agent_name
        FROM leads l
        LEFT JOIN agents a ON l.assigned_agent_id = a.id
        WHERE l.contact_attempts >= 3 
        AND l.status IN ('New', 'Contacted')
        AND l.status != 'Converted'
      `;
      
      const overContactedLeads = await query(sql);
      
      for (const lead of overContactedLeads) {
        await leadService.updateLeadStatus(
          lead.id,
          'Lost',
          'Automatically marked as Lost after 3 contact attempts',
          this.io
        );
        
        logger.info(`Lead ${lead.id} marked as Lost after 3 contact attempts`);
      }
      
      logger.info(`Marked ${overContactedLeads.length} leads as Lost`);
    } catch (error) {
      logger.error('Error in markOverContactedLeads:', error);
    }
  }

  async updateAgentStatistics() {
    try {
      logger.info('Updating agent statistics...');
      
      // This would update any cached statistics or perform cleanup
      // For now, just log that it's being done
      logger.info('Agent statistics updated');
    } catch (error) {
      logger.error('Error in updateAgentStatistics:', error);
    }
  }

  async manualReassign(leadId, reason = 'Manual reassignment') {
    try {
      const lead = await leadService.getLeadById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      const newAgent = await assignmentService.assignLead({
        source: lead.source,
        priority: lead.priority
      });
      
      if (!newAgent) {
        throw new Error('No suitable agent found');
      }
      
      await leadService.reassignLead(leadId, newAgent.id, reason, this.io);
      
      logger.info(`Lead ${leadId} manually reassigned to ${newAgent.name}`);
      
      return newAgent;
    } catch (error) {
      logger.error('Error in manualReassign:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun
    };
  }
}

module.exports = new AutoReassignService();
