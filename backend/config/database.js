const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const logger = require('../utils/logger');

let db;
let useInMemoryDB = false;

// Database configuration based on DB_TYPE
const dbConfig = {
  mysql: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lead_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  postgresql: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lead_management',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

const dbType = process.env.DB_TYPE || 'mysql';

async function initializeDatabase() {
  try {
    if (dbType === 'mysql') {
      db = mysql.createPool(dbConfig.mysql);
      logger.info('MySQL database pool created');
      // Test connection
      await db.execute('SELECT 1');
    } else if (dbType === 'postgresql') {
      db = new Pool(dbConfig.postgresql);
      logger.info('PostgreSQL database pool created');
      // Test connection
      await db.query('SELECT 1');
    } else {
      throw new Error('Unsupported database type. Use "mysql" or "postgresql"');
    }
  } catch (error) {
    logger.warn('Failed to connect to database, falling back to in-memory storage:', error.message);
    useInMemoryDB = true;
    initializeInMemoryDB();
  }
}

function initializeInMemoryDB() {
  // Simple in-memory database for demonstration
  const agents = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', is_active: true, can_handle_facebook: true, active_leads_count: 2, created_at: new Date(), updated_at: new Date() },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', is_active: true, can_handle_facebook: false, active_leads_count: 3, created_at: new Date(), updated_at: new Date() }
  ];
  
  const leads = [
    { id: 1, name: 'Alice Johnson', phone: '555-1234', source: 'Website', priority: 'High', status: 'New', assigned_agent_id: 1, contact_attempts: 0, notes: 'Interested in premium package', created_at: new Date(), updated_at: new Date() },
    { id: 2, name: 'Bob Wilson', phone: '555-5678', source: 'Facebook', priority: 'Medium', status: 'Contacted', assigned_agent_id: 2, contact_attempts: 1, last_contacted_at: new Date(), notes: 'Called yesterday', created_at: new Date(), updated_at: new Date() },
    { id: 3, name: 'Carol Davis', phone: '555-9012', source: 'Website', priority: 'Low', status: 'Converted', assigned_agent_id: 1, contact_attempts: 2, notes: 'Converted to sale', created_at: new Date(), updated_at: new Date() }
  ];

  global.inMemoryDB = { agents, leads };
  logger.info('In-memory database initialized with sample data');
}

// Initialize database connection will be called asynchronously

// Helper function to execute queries
async function query(sql, params = []) {
  try {
    if (useInMemoryDB) {
      return queryInMemoryDB(sql, params);
    }
    
    let result;
    
    if (dbType === 'mysql') {
      const [rows] = await db.execute(sql, params);
      result = rows;
    } else {
      const { rows } = await db.query(sql, params);
      result = rows;
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
}

function queryInMemoryDB(sql, params = []) {
  const db = global.inMemoryDB;
  const sqlLower = sql.toLowerCase();
  
  // Handle SELECT queries
  if (sqlLower.includes('select')) {
    // Handle agents with WHERE clause first (highest priority)
    if (sqlLower.includes('where') && sqlLower.includes('agents')) {
        const agentId = parseInt(params[0]);
        const agent = db.agents.find(a => a.id === agentId);
        if (agent) {
          const activeLeadsCount = db.leads.filter(l => 
            l.assigned_agent_id === agentId && ['New', 'Contacted'].includes(l.status)
          ).length;
          return [{
            ...agent,
            active_leads_count: activeLeadsCount
          }];
        }
        return [];
      }
      
    // Handle agent queries first (more specific patterns)
    if (sqlLower.includes('from agents a') || sqlLower.includes('where a.id =')) {
      // Handle agent statistics first (most specific)
      if (sqlLower.includes('select count(*) from leads') && sqlLower.includes('total_agents')) {
        // Agent statistics
        const agents = db.agents;
        return [{
          total_agents: agents.length,
          active_agents: agents.filter(a => a.is_active).length,
          facebook_agents: agents.filter(a => a.can_handle_facebook).length,
          total_active_leads: agents.reduce((sum, a) => sum + a.active_leads_count, 0)
        }];
      }
      
      // Handle agent by ID with active leads count (more specific than general agents)
      if (sqlLower.includes('where a.id =')) {
        const agentId = parseInt(params[0]);
        const agent = db.agents.find(a => a.id === agentId);
        if (agent) {
          const activeLeadsCount = db.leads.filter(l => 
            l.assigned_agent_id === agentId && ['New', 'Contacted'].includes(l.status)
          ).length;
          return [{
            ...agent,
            active_leads_count: activeLeadsCount
          }];
        }
        return [];
      }
      
      // Handle agent queries with active leads count (getAllAgents)
      if (sqlLower.includes('from agents a')) {
        const agentsWithLeads = db.agents.map(agent => {
          const activeLeadsCount = db.leads.filter(l => 
            l.assigned_agent_id === agent.id && ['New', 'Contacted'].includes(l.status)
          ).length;
          return {
            ...agent,
            active_leads_count: activeLeadsCount
          };
        });
        
        // Sort by is_active DESC, name ASC
        agentsWithLeads.sort((a, b) => {
          if (a.is_active !== b.is_active) {
            return b.is_active - a.is_active;
          }
          return a.name.localeCompare(b.name);
        });
        
        return agentsWithLeads;
      }
      
      // Default agents query fallback (for simple SELECT * FROM agents)
      if (sqlLower.includes('select * from agents') || 
          (sqlLower.includes('select') && sqlLower.includes('agents') && !sqlLower.includes('from agents a'))) {
        return db.agents;
      }
      
      return db.agents;
    }
    
    // Handle leads queries (only if not agent queries)
    if (sqlLower.includes('leads')) {
      // Handle lead statistics first (most specific)
      if (sqlLower.includes('count') && !sqlLower.includes('agents')) {
        // Lead statistics (only if not also mentioning agents)
        const leads = db.leads;
        return [{
          total_leads: leads.length,
          new_leads: leads.filter(l => l.status === 'New').length,
          contacted_leads: leads.filter(l => l.status === 'Contacted').length,
          converted_leads: leads.filter(l => l.status === 'Converted').length,
          lost_leads: leads.filter(l => l.status === 'Lost').length,
          high_priority_leads: leads.filter(l => l.priority === 'High').length,
          facebook_leads: leads.filter(l => l.source === 'Facebook').length,
          assigned_leads: leads.filter(l => l.assigned_agent_id != null).length,
          unassigned_leads: leads.filter(l => l.assigned_agent_id == null).length
        }];
      }
      
      // Handle get lead by ID first (more specific)
      if (sqlLower.includes('where l.id =') && params.length === 1) {
        // Get lead by ID (single parameter, no pagination)
        const leadId = parseInt(params[0]);
        const lead = db.leads.find(l => l.id === leadId);
        if (lead) {
          const agent = db.agents.find(a => a.id === lead.assigned_agent_id);
          return [{
            ...lead,
            agent_name: agent ? agent.name : null,
            agent_email: agent ? agent.email : null
          }];
        }
        return [];
      }
      
      // Handle complex leads query with JOIN
      if (sqlLower.includes('left join agents')) {
        let leads = [...db.leads];
        
        // Apply filters - only if there are actual filter values
        // The params array contains filters first, then limit and offset at the end
        const filterParams = params.slice(0, -2);
        
        if (filterParams.length > 0) {
          const status = filterParams.find(p => typeof p === 'string' && ['New', 'Contacted', 'Converted', 'Lost'].includes(p));
          if (status) {
            leads = leads.filter(l => l.status === status);
          }
          
          const priority = filterParams.find(p => typeof p === 'string' && ['High', 'Medium', 'Low'].includes(p));
          if (priority) {
            leads = leads.filter(l => l.priority === priority);
          }
          
          const source = filterParams.find(p => typeof p === 'string' && ['Facebook', 'Website', 'Referral', 'Email', 'Phone', 'Walk-in', 'Other'].includes(p));
          if (source) {
            leads = leads.filter(l => l.source === source);
          }
          
          const agentId = filterParams.find(p => typeof p === 'number');
          if (agentId) {
            leads = leads.filter(l => l.assigned_agent_id === agentId);
          }
        }
        
        // Join with agents
        const leadsWithAgents = leads.map(lead => {
          const agent = db.agents.find(a => a.id === lead.assigned_agent_id);
          return {
            ...lead,
            agent_name: agent ? agent.name : null,
            agent_email: agent ? agent.email : null
          };
        });
        
        // Apply sorting and pagination
        leadsWithAgents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // The last two parameters are limit and offset
        const limit = params[params.length - 2] || 50;
        const offset = params[params.length - 1] || 0;
        
        const paginatedLeads = leadsWithAgents.slice(offset, offset + limit);
        
        return paginatedLeads;
      }
      
      // Handle duplicate phone check
      if (sqlLower.includes('where phone =')) {
        // Check for duplicate phone number
        const phone = params[0];
        const existingLead = db.leads.find(l => l.phone === phone);
        return existingLead ? [{ id: existingLead.id }] : [];
      }
      
      // Return all leads
      return db.leads;
    }
  }
  
  // Handle INSERT queries
  if (sqlLower.includes('insert into leads')) {
    const newLead = {
      id: Math.max(...db.leads.map(l => l.id)) + 1,
      name: params[0],
      phone: params[1],
      source: params[2],
      priority: params[3],
      assigned_agent_id: params[4],
      notes: params[5],
      status: 'New',
      contact_attempts: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    db.leads.push(newLead);
    return [{ insertId: newLead.id }];
  }
  
  // Handle UPDATE queries
  if (sqlLower.includes('update leads')) {
    // Update lead
    const leadId = parseInt(params[5]); // ID is the last parameter in the UPDATE query
    const lead = db.leads.find(l => l.id === leadId);
    if (lead) {
      lead.name = params[0];
      lead.phone = params[1];
      lead.source = params[2];
      lead.priority = params[3];
      lead.notes = params[4];
      lead.updated_at = new Date();
    }
    return [{ affectedRows: lead ? 1 : 0 }];
  }
  
  if (sqlLower.includes('update agents')) {
    if (sqlLower.includes('active_leads_count')) {
      // Update agent active leads count
      const agentId = params[1];
      const agent = db.agents.find(a => a.id === agentId);
      if (agent) {
        agent.active_leads_count = db.leads.filter(l => 
          l.assigned_agent_id === agentId && ['New', 'Contacted'].includes(l.status)
        ).length;
      }
      return [{ affectedRows: 1 }];
    } else {
      // General agent update (name, email, phone, is_active, can_handle_facebook)
      const agentId = params[5]; // ID is the last parameter
      const agent = db.agents.find(a => a.id === agentId);
      if (agent) {
        // Only update fields that are provided (not null/undefined)
        if (params[0] !== undefined && params[0] !== null) agent.name = params[0];
        if (params[1] !== undefined && params[1] !== null) agent.email = params[1];
        if (params[2] !== undefined && params[2] !== null) agent.phone = params[2];
        if (params[3] !== undefined && params[3] !== null) agent.is_active = params[3];
        if (params[4] !== undefined && params[4] !== null) agent.can_handle_facebook = params[4];
        agent.updated_at = new Date();
      }
      return [{ affectedRows: agent ? 1 : 0 }];
    }
  }
  
  // Handle INSERT for agents
  if (sqlLower.includes('insert into agents')) {
    const newAgent = {
      id: Math.max(...db.agents.map(a => a.id)) + 1,
      name: params[0],
      email: params[1],
      phone: params[2],
      is_active: params[3],
      can_handle_facebook: params[4],
      active_leads_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    db.agents.push(newAgent);
    return [{ insertId: newAgent.id }];
  }
  
  // Handle INSERT for lead_history
  if (sqlLower.includes('insert into lead_history')) {
    const newHistoryEntry = {
      id: Math.max(...(db.leadHistory || []).map(h => h.id || 0)) + 1,
      lead_id: params[0],
      agent_id: params[1],
      action: params[2],
      notes: params[3],
      created_at: new Date()
    };
    if (!db.leadHistory) db.leadHistory = [];
    db.leadHistory.push(newHistoryEntry);
    return [{ insertId: newHistoryEntry.id }];
  }
  
  return [];
}

// Helper function to execute transaction
async function transaction(queries) {
  const connection = dbType === 'mysql' ? await db.getConnection() : await db.connect();
  
  try {
    if (dbType === 'mysql') {
      await connection.beginTransaction();
      
      const results = [];
      for (const { sql, params } of queries) {
        const [rows] = await connection.execute(sql, params);
        results.push(rows);
      }
      
      await connection.commit();
      return results;
    } else {
      await connection.query('BEGIN');
      
      const results = [];
      for (const { sql, params } of queries) {
        const { rows } = await connection.query(sql, params);
        results.push(rows);
      }
      
      await connection.query('COMMIT');
      return results;
    }
  } catch (error) {
    if (dbType === 'mysql') {
      await connection.rollback();
    } else {
      await connection.query('ROLLBACK');
    }
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    if (dbType === 'mysql') {
      connection.release();
    } else {
      connection.release();
    }
  }
}

// Get database type for conditional queries
function getDatabaseType() {
  return dbType;
}

// Close database connection
async function close() {
  if (dbType === 'mysql') {
    await db.end();
  } else {
    await db.end();
  }
}

module.exports = {
  query,
  transaction,
  getDatabaseType,
  close,
  initializeDatabase
};
