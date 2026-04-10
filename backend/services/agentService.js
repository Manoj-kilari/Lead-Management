const { query, getDatabaseType } = require('../config/database');
const logger = require('../utils/logger');

class AgentService {
  async getAllAgents() {
    try {
      const sql = `
        SELECT 
          a.*,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status IN ('New', 'Contacted')) as active_leads_count
        FROM agents a
        ORDER BY a.is_active DESC, a.name ASC
      `;
      
      const agents = await query(sql);
      return agents;
    } catch (error) {
      logger.error('Error in getAllAgents:', error);
      throw error;
    }
  }

  async getAgentById(id) {
    try {
      const sql = `
        SELECT 
          a.*,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status IN ('New', 'Contacted')) as active_leads_count
        FROM agents a
        WHERE a.id = ?
      `;
      
      const agents = await query(sql, [id]);
      return agents[0] || null;
    } catch (error) {
      logger.error('Error in getAgentById:', error);
      throw error;
    }
  }

  async createAgent(agentData) {
    try {
      const { name, email, phone, is_active = true, can_handle_facebook = false } = agentData;
      
      const sql = `
        INSERT INTO agents (name, email, phone, is_active, can_handle_facebook)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const result = await query(sql, [name, email, phone, is_active, can_handle_facebook]);
      
      // Return the created agent
      const dbType = getDatabaseType();
      const agentId = dbType === 'mysql' ? (result.insertId || result[0]?.insertId) : result[0]?.id;
      
      return await this.getAgentById(agentId);
    } catch (error) {
      logger.error('Error in createAgent:', error);
      throw error;
    }
  }

  async updateAgent(id, agentData) {
    try {
      // Get current agent data
      const currentAgent = await this.getAgentById(id);
      if (!currentAgent) {
        return null;
      }

      // Merge current data with updates (only update provided fields)
      const updatedData = {
        name: agentData.name !== undefined ? agentData.name : currentAgent.name,
        email: agentData.email !== undefined ? agentData.email : currentAgent.email,
        phone: agentData.phone !== undefined ? agentData.phone : currentAgent.phone,
        is_active: agentData.is_active !== undefined ? agentData.is_active : currentAgent.is_active,
        can_handle_facebook: agentData.can_handle_facebook !== undefined ? agentData.can_handle_facebook : currentAgent.can_handle_facebook
      };
      
      const sql = `
        UPDATE agents 
        SET name = ?, email = ?, phone = ?, is_active = ?, can_handle_facebook = ?
        WHERE id = ?
      `;
      
      await query(sql, [updatedData.name, updatedData.email, updatedData.phone, updatedData.is_active, updatedData.can_handle_facebook, id]);
      
      return await this.getAgentById(id);
    } catch (error) {
      logger.error('Error in updateAgent:', error);
      throw error;
    }
  }

  async deleteAgent(id) {
    try {
      // Check if agent has active leads
      const activeLeadsCheck = await query(
        'SELECT COUNT(*) as count FROM leads WHERE assigned_agent_id = ? AND status IN ("New", "Contacted")',
        [id]
      );
      
      if (activeLeadsCheck[0].count > 0) {
        throw new Error('Cannot delete agent with active leads');
      }
      
      // Reassign any leads to null
      await query('UPDATE leads SET assigned_agent_id = NULL WHERE assigned_agent_id = ?', [id]);
      
      // Delete agent
      const result = await query('DELETE FROM agents WHERE id = ?', [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error in deleteAgent:', error);
      throw error;
    }
  }

  async getAgentStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_agents,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_agents,
          COUNT(CASE WHEN can_handle_facebook = true THEN 1 END) as facebook_agents,
          SUM(active_leads_count) as total_active_leads
        FROM (
          SELECT 
            a.*,
            (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status IN ('New', 'Contacted')) as active_leads_count
          FROM agents a
        ) as agent_stats
      `);
      
      return stats[0];
    } catch (error) {
      logger.error('Error in getAgentStats:', error);
      throw error;
    }
  }

  async getAgentPerformance(id) {
    try {
      const performance = await query(`
        SELECT 
          a.*,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status IN ('New', 'Contacted')) as active_leads,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status = 'Converted') as converted_leads,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status = 'Lost') as lost_leads,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id) as total_leads,
          ROUND(
            (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status = 'Converted') * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id), 0), 2
          ) as conversion_rate
        FROM agents a
        WHERE a.id = ?
      `, [id]);
      
      return performance[0] || null;
    } catch (error) {
      logger.error('Error in getAgentPerformance:', error);
      throw error;
    }
  }

  async getActiveAgents() {
    try {
      const sql = `
        SELECT 
          a.*,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status IN ('New', 'Contacted')) as active_leads_count
        FROM agents a
        WHERE a.is_active = true
        ORDER BY a.active_leads_count ASC, a.name ASC
      `;
      
      return await query(sql);
    } catch (error) {
      logger.error('Error in getActiveAgents:', error);
      throw error;
    }
  }

  async getFacebookAgents() {
    try {
      const sql = `
        SELECT 
          a.*,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status IN ('New', 'Contacted')) as active_leads_count
        FROM agents a
        WHERE a.is_active = true AND a.can_handle_facebook = true
        ORDER BY a.active_leads_count ASC, a.name ASC
      `;
      
      return await query(sql);
    } catch (error) {
      logger.error('Error in getFacebookAgents:', error);
      throw error;
    }
  }

  async getTopAgents(limit = 2) {
    try {
      const sql = `
        SELECT 
          a.*,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status IN ('New', 'Contacted')) as active_leads_count,
          (SELECT COUNT(*) FROM leads WHERE assigned_agent_id = a.id AND status = 'Converted') as converted_leads
        FROM agents a
        WHERE a.is_active = true
        ORDER BY converted_leads DESC, active_leads_count ASC
        LIMIT ?
      `;
      
      return await query(sql, [limit]);
    } catch (error) {
      logger.error('Error in getTopAgents:', error);
      throw error;
    }
  }
}

module.exports = new AgentService();
