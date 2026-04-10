const agentService = require('./agentService');
const leadService = require('./leadService');
const logger = require('../utils/logger');

class AssignmentService {
  async assignLead(leadData) {
    try {
      const { source, priority } = leadData;
      
      // Get active agents
      const activeAgents = await agentService.getActiveAgents();
      
      if (activeAgents.length === 0) {
        logger.warn('No active agents available for assignment');
        return null;
      }
      
      let selectedAgent;
      
      // Special logic for Facebook leads
      if (source === 'Facebook') {
        const facebookAgents = await agentService.getFacebookAgents();
        if (facebookAgents.length === 0) {
          logger.warn('No agents available for Facebook leads');
          return null;
        }
        selectedAgent = this.selectLeastLoadedAgent(facebookAgents);
      } else {
        // High priority leads go to top 2 agents
        if (priority === 'High') {
          const topAgents = await agentService.getTopAgents(2);
          if (topAgents.length > 0) {
            selectedAgent = this.selectLeastLoadedAgent(topAgents);
          } else {
            // Fallback to least loaded agent
            selectedAgent = this.selectLeastLoadedAgent(activeAgents);
          }
        } else {
          // Regular assignment to least loaded agent
          selectedAgent = this.selectLeastLoadedAgent(activeAgents);
        }
      }
      
      if (selectedAgent) {
        logger.info(`Lead assigned to agent ${selectedAgent.name} (ID: ${selectedAgent.id})`);
        return selectedAgent;
      }
      
      return null;
    } catch (error) {
      logger.error('Error in assignLead:', error);
      throw error;
    }
  }

  selectLeastLoadedAgent(agents) {
    if (agents.length === 0) return null;
    
    // Sort by active leads count (ascending), then by name
    agents.sort((a, b) => {
      if (a.active_leads_count !== b.active_leads_count) {
        return a.active_leads_count - b.active_leads_count;
      }
      return a.name.localeCompare(b.name);
    });
    
    return agents[0];
  }

  async rebalanceLeads() {
    try {
      logger.info('Starting lead rebalancing...');
      
      const agents = await agentService.getActiveAgents();
      const unassignedLeads = await leadService.getAllLeads({ agent_id: null });
      
      if (unassignedLeads.leads.length === 0) {
        logger.info('No unassigned leads to rebalance');
        return;
      }
      
      // Assign each unassigned lead
      for (const lead of unassignedLeads.leads) {
        const assignedAgent = await this.assignLead({
          source: lead.source,
          priority: lead.priority
        });
        
        if (assignedAgent) {
          await leadService.reassignLead(
            lead.id, 
            assignedAgent.id, 
            'Auto-rebalancing: Lead was unassigned'
          );
        }
      }
      
      logger.info(`Rebalancing completed. ${unassignedLeads.leads.length} leads processed.`);
    } catch (error) {
      logger.error('Error in rebalanceLeads:', error);
      throw error;
    }
  }

  async getAssignmentStats() {
    try {
      const agents = await agentService.getAllAgents();
      
      const stats = {
        total_agents: agents.length,
        active_agents: agents.filter(a => a.is_active).length,
        agents_with_leads: agents.filter(a => a.active_leads_count > 0).length,
        total_active_leads: agents.reduce((sum, a) => sum + a.active_leads_count, 0),
        average_leads_per_agent: 0,
        agent_distribution: agents.map(a => ({
          id: a.id,
          name: a.name,
          active_leads: a.active_leads_count,
          is_active: a.is_active,
          can_handle_facebook: a.can_handle_facebook
        }))
      };
      
      if (stats.active_agents > 0) {
        stats.average_leads_per_agent = stats.total_active_leads / stats.active_agents;
      }
      
      return stats;
    } catch (error) {
      logger.error('Error in getAssignmentStats:', error);
      throw error;
    }
  }

  async checkAgentCapacity() {
    try {
      const agents = await agentService.getActiveAgents();
      
      const capacityReport = agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        current_load: agent.active_leads_count,
        is_overloaded: agent.active_leads_count > 10, // Threshold for overload
        can_handle_more: agent.active_leads_count < 15, // Capacity threshold
        facebook_capable: agent.can_handle_facebook
      }));
      
      return capacityReport;
    } catch (error) {
      logger.error('Error in checkAgentCapacity:', error);
      throw error;
    }
  }

  // Advanced Logic: Auto reassign stale leads (not updated within 2 hours)
  async reassignStaleLeads() {
    try {
      logger.info('Starting stale lead reassignment process...');
      
      const staleLeads = await leadService.getStaleLeads(2); // 2 hours threshold
      
      if (staleLeads.length === 0) {
        logger.info('No stale leads found for reassignment');
        return { processed: 0, reassigned: 0 };
      }
      
      let processed = 0;
      let reassigned = 0;
      
      for (const staleLead of staleLeads) {
        processed++;
        
        // Get current agent's workload
        const currentAgent = await agentService.getAgentById(staleLead.assigned_agent_id);
        
        // Check if current agent is overloaded or inactive
        const needsReassignment = !currentAgent || 
                                  !currentAgent.is_active || 
                                  currentAgent.active_leads_count > 15;
        
        if (needsReassignment) {
          // Find a better agent
          const newAgent = await this.assignLead({
            source: staleLead.source,
            priority: staleLead.priority
          });
          
          if (newAgent && newAgent.id !== staleLead.assigned_agent_id) {
            await leadService.reassignLead(
              staleLead.id,
              newAgent.id,
              `Auto-reassignment: Lead was stale for ${staleLead.hours_since_update} hours and previous agent was overloaded/inactive`
            );
            
            reassigned++;
            logger.info(`Stale lead ${staleLead.id} reassigned from agent ${staleLead.assigned_agent_id} to agent ${newAgent.id}`);
          }
        }
      }
      
      logger.info(`Stale lead reassignment completed. Processed: ${processed}, Reassigned: ${reassigned}`);
      return { processed, reassigned };
    } catch (error) {
      logger.error('Error in reassignStaleLeads:', error);
      throw error;
    }
  }

  // Advanced Logic: Check for leads that need auto Lost status (3 contact attempts)
  async processAutoLostLeads() {
    try {
      logger.info('Starting auto Lost status processing...');
      
      // Get leads with 3+ contact attempts that are still New/Contacted
      const sql = `
        SELECT l.*, a.name as agent_name
        FROM leads l
        LEFT JOIN agents a ON l.assigned_agent_id = a.id
        WHERE l.contact_attempts >= 3 
        AND l.status IN ('New', 'Contacted')
        AND l.assigned_agent_id IS NOT NULL
      `;
      
      const leadsToMarkLost = await require('../config/database').query(sql);
      
      if (leadsToMarkLost.length === 0) {
        logger.info('No leads found for auto Lost status');
        return { processed: 0, marked_lost: 0 };
      }
      
      let processed = 0;
      let markedLost = 0;
      
      for (const lead of leadsToMarkLost) {
        processed++;
        
        // Mark as Lost
        await leadService.updateLeadStatus(
          lead.id,
          'Lost',
          `Automatically marked as Lost after ${lead.contact_attempts} contact attempts`
        );
        
        markedLost++;
        logger.info(`Lead ${lead.id} automatically marked as Lost after ${lead.contact_attempts} contact attempts`);
      }
      
      logger.info(`Auto Lost status processing completed. Processed: ${processed}, Marked Lost: ${markedLost}`);
      return { processed, marked_lost };
    } catch (error) {
      logger.error('Error in processAutoLostLeads:', error);
      throw error;
    }
  }

  // Comprehensive assignment logic with all rules
  async assignLeadWithAdvancedLogic(leadData) {
    try {
      const { source, priority, current_agent_id } = leadData;
      
      // Rule 4: Skip inactive agents (already enforced in getActiveAgents)
      const activeAgents = await agentService.getActiveAgents();
      
      if (activeAgents.length === 0) {
        logger.warn('No active agents available for assignment');
        return null;
      }
      
      let selectedAgent;
      let assignmentReason = '';
      
      // Rule 3: Facebook leads assigned only to specific agents
      if (source === 'Facebook') {
        const facebookAgents = await agentService.getFacebookAgents();
        if (facebookAgents.length === 0) {
          logger.warn('No Facebook-capable agents available for Facebook lead');
          return null;
        }
        selectedAgent = this.selectLeastLoadedAgent(facebookAgents);
        assignmentReason = 'Facebook lead assigned to least loaded Facebook-capable agent';
      }
      // Rule 2: High priority leads distributed among top 2 agents
      else if (priority === 'High') {
        const topAgents = await agentService.getTopAgents(2);
        if (topAgents.length > 0) {
          selectedAgent = this.selectLeastLoadedAgent(topAgents);
          assignmentReason = 'High priority lead assigned to least loaded top performer';
        } else {
          // Fallback to least loaded active agent
          selectedAgent = this.selectLeastLoadedAgent(activeAgents);
          assignmentReason = 'High priority lead assigned to least loaded agent (no top performers available)';
        }
      }
      // Rule 1: Assign to least loaded agent (default)
      else {
        selectedAgent = this.selectLeastLoadedAgent(activeAgents);
        assignmentReason = 'Standard lead assigned to least loaded active agent';
      }
      
      if (selectedAgent) {
        logger.info(`Lead assigned to agent ${selectedAgent.name} (ID: ${selectedAgent.id}) - ${assignmentReason}`);
        return {
          ...selectedAgent,
          assignment_reason: assignmentReason
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error in assignLeadWithAdvancedLogic:', error);
      throw error;
    }
  }
}

module.exports = new AssignmentService();
