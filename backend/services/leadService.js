const { query, transaction, getDatabaseType } = require('../config/database');
const agentService = require('./agentService');
const assignmentService = require('./assignmentService');
const logger = require('../utils/logger');

class LeadService {
  async getAllLeads(filters = {}) {
    try {
      const { status, priority, source, agent_id, page = 1, limit = 50 } = filters;
      const offset = (page - 1) * limit;
      
      let whereClauses = [];
      let params = [];
      
      if (status) {
        whereClauses.push('l.status = ?');
        params.push(status);
      }
      
      if (priority) {
        whereClauses.push('l.priority = ?');
        params.push(priority);
      }
      
      if (source) {
        whereClauses.push('l.source = ?');
        params.push(source);
      }
      
      if (agent_id) {
        whereClauses.push('l.assigned_agent_id = ?');
        params.push(agent_id);
      }
      
      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      
      const sql = `
        SELECT 
          l.*,
          a.name as agent_name,
          a.email as agent_email
        FROM leads l
        LEFT JOIN agents a ON l.assigned_agent_id = a.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const leads = await query(sql, [...params, limit, offset]);
      
      // Get total count
      const countSql = `
        SELECT COUNT(*) as total
        FROM leads l
        ${whereClause}
      `;
      
      const countResult = await query(countSql, params);
      
      return {
        leads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in getAllLeads:', error);
      throw error;
    }
  }

  async getLeadById(id) {
    try {
      const sql = `
        SELECT 
          l.*,
          a.name as agent_name,
          a.email as agent_email
        FROM leads l
        LEFT JOIN agents a ON l.assigned_agent_id = a.id
        WHERE l.id = ?
      `;
      
      const leads = await query(sql, [id]);
      return leads[0] || null;
    } catch (error) {
      logger.error('Error in getLeadById:', error);
      throw error;
    }
  }

  async createLead(leadData, io) {
    try {
      const { name, phone, source, priority = 'Medium', notes } = leadData;
      
      // Check for duplicate phone number
      const existingLead = await query('SELECT id FROM leads WHERE phone = ?', [phone]);
      if (existingLead.length > 0) {
        throw new Error('Lead with this phone number already exists');
      }
      
      // Auto-assign lead using smart assignment logic
      const assignedAgent = await assignmentService.assignLeadWithAdvancedLogic({ source, priority });
      
      const sql = `
        INSERT INTO leads (name, phone, source, priority, assigned_agent_id, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await query(sql, [name, phone, source, priority, assignedAgent?.id || null, notes]);
      
      // Get the created lead
      const dbType = getDatabaseType();
      const leadId = dbType === 'mysql' ? (result.insertId || result[0]?.insertId) : result[0]?.id;
      
      const lead = await this.getLeadById(leadId);
      
      // Create history entry
      await this.createHistoryEntry(leadId, assignedAgent?.id || null, 'Created', `Lead created and assigned to ${assignedAgent?.name || 'unassigned'}`);
      
      // Update agent's active leads count
      if (assignedAgent) {
        await this.updateAgentActiveLeads(assignedAgent.id);
      }
      
      // Emit real-time update
      if (io) {
        io.emit('lead:created', lead);
        io.emit('stats:updated');
      }
      
      return lead;
    } catch (error) {
      logger.error('Error in createLead:', error);
      throw error;
    }
  }

  async updateLead(id, leadData, io) {
    try {
      const { name, phone, source, priority, notes } = leadData;
      
      const sql = `
        UPDATE leads 
        SET name = ?, phone = ?, source = ?, priority = ?, notes = ?
        WHERE id = ?
      `;
      
      await query(sql, [name, phone, source, priority, notes, id]);
      
      const lead = await this.getLeadById(id);
      
      // Create history entry
      await this.createHistoryEntry(id, lead.assigned_agent_id, 'Updated', 'Lead information updated');
      
      // Emit real-time update
      if (io) {
        io.emit('lead:updated', lead);
      }
      
      return lead;
    } catch (error) {
      logger.error('Error in updateLead:', error);
      throw error;
    }
  }

  async deleteLead(id) {
    try {
      const lead = await this.getLeadById(id);
      if (!lead) {
        return false;
      }
      
      // Delete history entries first
      await query('DELETE FROM lead_history WHERE lead_id = ?', [id]);
      
      // Delete lead
      const result = await query('DELETE FROM leads WHERE id = ?', [id]);
      
      // Update agent's active leads count
      if (lead.assigned_agent_id) {
        await this.updateAgentActiveLeads(lead.assigned_agent_id);
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error in deleteLead:', error);
      throw error;
    }
  }

  async updateLeadStatus(id, status, notes, io) {
    try {
      const lead = await this.getLeadById(id);
      if (!lead) {
        return null;
      }
      
      const sql = 'UPDATE leads SET status = ? WHERE id = ?';
      await query(sql, [status, id]);
      
      // Update last_contacted_at if status is 'Contacted'
      if (status === 'Contacted') {
        await query('UPDATE leads SET last_contacted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      }
      
      // Create history entry
      await this.createHistoryEntry(id, lead.assigned_agent_id, 'Status_Changed', `Status changed to ${status}. ${notes || ''}`);
      
      // Update agent's active leads count
      if (lead.assigned_agent_id) {
        await this.updateAgentActiveLeads(lead.assigned_agent_id);
      }
      
      const updatedLead = await this.getLeadById(id);
      
      // Emit real-time update
      if (io) {
        io.emit('lead:status_updated', updatedLead);
        io.emit('stats:updated');
      }
      
      return updatedLead;
    } catch (error) {
      logger.error('Error in updateLeadStatus:', error);
      throw error;
    }
  }

  async recordContactAttempt(id, notes, successful, io) {
    try {
      const lead = await this.getLeadById(id);
      if (!lead) {
        return null;
      }
      
      // Increment contact attempts
      await query('UPDATE leads SET contact_attempts = contact_attempts + 1 WHERE id = ?', [id]);
      
      // Check if lead should be marked as Lost (3 attempts and not converted)
      const updatedLead = await this.getLeadById(id);
      if (updatedLead.contact_attempts >= 3 && updatedLead.status !== 'Converted') {
        await this.updateLeadStatus(id, 'Lost', 'Automatically marked as Lost after 3 contact attempts', io);
      }
      
      // Create history entry
      await this.createHistoryEntry(id, lead.assigned_agent_id, 'Contacted', `Contact attempt ${successful ? 'successful' : 'unsuccessful'}. ${notes || ''}`);
      
      // Emit real-time update
      if (io) {
        io.emit('lead:contacted', updatedLead);
      }
      
      return updatedLead;
    } catch (error) {
      logger.error('Error in recordContactAttempt:', error);
      throw error;
    }
  }

  async reassignLead(id, agentId, reason, io) {
    try {
      const lead = await this.getLeadById(id);
      if (!lead) {
        return null;
      }
      
      const oldAgentId = lead.assigned_agent_id;
      
      // Update lead assignment
      await query('UPDATE leads SET assigned_agent_id = ? WHERE id = ?', [agentId, id]);
      
      // Create history entry
      await this.createHistoryEntry(id, agentId, 'Reassigned', `Reassigned from agent ${oldAgentId}. ${reason || ''}`);
      
      // Update both agents' active leads counts
      if (oldAgentId) {
        await this.updateAgentActiveLeads(oldAgentId);
      }
      if (agentId) {
        await this.updateAgentActiveLeads(agentId);
      }
      
      const updatedLead = await this.getLeadById(id);
      
      // Emit real-time update
      if (io) {
        io.emit('lead:reassigned', updatedLead);
        io.emit('stats:updated');
      }
      
      return updatedLead;
    } catch (error) {
      logger.error('Error in reassignLead:', error);
      throw error;
    }
  }

  async getLeadStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(CASE WHEN status = 'New' THEN 1 END) as new_leads,
          COUNT(CASE WHEN status = 'Contacted' THEN 1 END) as contacted_leads,
          COUNT(CASE WHEN status = 'Converted' THEN 1 END) as converted_leads,
          COUNT(CASE WHEN status = 'Lost' THEN 1 END) as lost_leads,
          COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_priority_leads,
          COUNT(CASE WHEN source = 'Facebook' THEN 1 END) as facebook_leads,
          COUNT(CASE WHEN assigned_agent_id IS NOT NULL THEN 1 END) as assigned_leads,
          COUNT(CASE WHEN assigned_agent_id IS NULL THEN 1 END) as unassigned_leads
        FROM leads
      `);
      
      return stats[0];
    } catch (error) {
      logger.error('Error in getLeadStats:', error);
      throw error;
    }
  }

  async getLeadHistory(id) {
    try {
      const sql = `
        SELECT 
          lh.*,
          a.name as agent_name
        FROM lead_history lh
        LEFT JOIN agents a ON lh.agent_id = a.id
        WHERE lh.lead_id = ?
        ORDER BY lh.created_at DESC
      `;
      
      return await query(sql, [id]);
    } catch (error) {
      logger.error('Error in getLeadHistory:', error);
      throw error;
    }
  }

  async getStaleLeads(hours = 2) {
    try {
      const sql = `
        SELECT 
          l.*,
          a.name as agent_name,
          TIMESTAMPDIFF(HOUR, l.updated_at, CURRENT_TIMESTAMP) as hours_since_update
        FROM leads l
        LEFT JOIN agents a ON l.assigned_agent_id = a.id
        WHERE l.status IN ('New', 'Contacted')
        AND l.updated_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
        ORDER BY l.updated_at ASC
      `;
      
      return await query(sql, [hours]);
    } catch (error) {
      logger.error('Error in getStaleLeads:', error);
      throw error;
    }
  }

  async createHistoryEntry(leadId, agentId, action, notes) {
    try {
      const sql = `
        INSERT INTO lead_history (lead_id, agent_id, action, notes)
        VALUES (?, ?, ?, ?)
      `;
      
      await query(sql, [leadId, agentId, action, notes]);
    } catch (error) {
      logger.error('Error in createHistoryEntry:', error);
      throw error;
    }
  }

  async updateAgentActiveLeads(agentId) {
    try {
      const sql = `
        UPDATE agents 
        SET active_leads_count = (
          SELECT COUNT(*) 
          FROM leads 
          WHERE assigned_agent_id = ? AND status IN ('New', 'Contacted')
        )
        WHERE id = ?
      `;
      
      await query(sql, [agentId, agentId]);
    } catch (error) {
      logger.error('Error in updateAgentActiveLeads:', error);
      throw error;
    }
  }
}

module.exports = new LeadService();
