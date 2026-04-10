const { query, initializeDatabase } = require('../config/database');
const logger = require('../utils/logger');

const demoLeads = [
  {
    name: 'Robert Anderson',
    phone: '555-0301',
    source: 'Facebook',
    priority: 'High',
    status: 'New',
    notes: 'Interested in premium package, follow up ASAP'
  },
  {
    name: 'Jennifer Martinez',
    phone: '555-0302',
    source: 'Website',
    priority: 'Medium',
    status: 'Contacted',
    notes: 'Called once, left voicemail'
  },
  {
    name: 'Michael Thompson',
    phone: '555-0303',
    source: 'Referral',
    priority: 'High',
    status: 'Converted',
    notes: 'Converted to premium plan'
  },
  {
    name: 'Lisa Garcia',
    phone: '555-0304',
    source: 'Facebook',
    priority: 'Low',
    status: 'New',
    notes: 'Basic inquiry, not urgent'
  },
  {
    name: 'David Chen',
    phone: '555-0305',
    source: 'Website',
    priority: 'High',
    status: 'Contacted',
    notes: 'Email sent, awaiting response'
  },
  {
    name: 'Amanda White',
    phone: '555-0306',
    source: 'Facebook',
    priority: 'Medium',
    status: 'New',
    notes: 'Referred by existing customer'
  },
  {
    name: 'Christopher Lee',
    phone: '555-0307',
    source: 'Referral',
    priority: 'High',
    status: 'Lost',
    notes: 'Decided to go with competitor'
  },
  {
    name: 'Michelle Rodriguez',
    phone: '555-0308',
    source: 'Website',
    priority: 'Medium',
    status: 'Contacted',
    notes: 'Scheduled callback for tomorrow'
  },
  {
    name: 'James Taylor',
    phone: '555-0309',
    source: 'Facebook',
    priority: 'Low',
    status: 'New',
    notes: 'Just browsing, no immediate need'
  },
  {
    name: 'Patricia Moore',
    phone: '555-0310',
    source: 'Website',
    priority: 'High',
    status: 'Converted',
    notes: 'Signed up for enterprise plan'
  },
  {
    name: 'Daniel Jackson',
    phone: '555-0311',
    source: 'Facebook',
    priority: 'Medium',
    status: 'Contacted',
    notes: 'Interested but needs more information'
  },
  {
    name: 'Nancy Martin',
    phone: '555-0312',
    source: 'Referral',
    priority: 'Low',
    status: 'New',
    notes: 'Casual inquiry'
  },
  {
    name: 'Kevin Hill',
    phone: '555-0313',
    source: 'Website',
    priority: 'High',
    status: 'New',
    notes: 'Urgent request for demo'
  },
  {
    name: 'Susan Clark',
    phone: '555-0314',
    source: 'Facebook',
    priority: 'Medium',
    status: 'Lost',
    notes: 'Budget constraints'
  },
  {
    name: 'Richard Lewis',
    phone: '555-0315',
    source: 'Referral',
    priority: 'High',
    status: 'Contacted',
    notes: 'Very interested, follow up next week'
  }
];

const demoAgents = [
  {
    name: 'Alex Turner',
    email: 'alex.turner@example.com',
    phone: '555-0201',
    is_active: true,
    can_handle_facebook: true
  },
  {
    name: 'Sophie Chen',
    email: 'sophie.chen@example.com',
    phone: '555-0202',
    is_active: true,
    can_handle_facebook: false
  }
];

async function addDemoData() {
  try {
    // Initialize database connection first
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    console.log('Adding demo agents...');
    
    // Add demo agents
    for (const agent of demoAgents) {
      const existingAgent = await query('SELECT id FROM agents WHERE email = ?', [agent.email]);
      if (existingAgent.length === 0) {
        await query(
          'INSERT INTO agents (name, email, phone, is_active, can_handle_facebook) VALUES (?, ?, ?, ?, ?)',
          [agent.name, agent.email, agent.phone, agent.is_active, agent.can_handle_facebook]
        );
        console.log(`Added agent: ${agent.name}`);
      }
    }

    // Get all active agents for assignment
    const agents = await query('SELECT id FROM agents WHERE is_active = true');
    
    console.log('Adding demo leads...');
    
    // Add demo leads with random agent assignments
    for (let i = 0; i < demoLeads.length; i++) {
      const lead = demoLeads[i];
      
      // Check if lead already exists
      const existingLead = await query('SELECT id FROM leads WHERE phone = ?', [lead.phone]);
      
      if (existingLead.length === 0) {
        // Randomly assign to an agent or leave unassigned
        const assignedAgentId = Math.random() > 0.3 ? agents[Math.floor(Math.random() * agents.length)].id : null;
        
        const result = await query(
          'INSERT INTO leads (name, phone, source, priority, status, assigned_agent_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [lead.name, lead.phone, lead.source, lead.priority, lead.status, assignedAgentId, lead.notes]
        );
        
        const leadId = result.insertId || result[0].id;
        
        // Create history entry
        await query(
          'INSERT INTO lead_history (lead_id, agent_id, action, notes) VALUES (?, ?, ?, ?)',
          [leadId, assignedAgentId, 'Created', `Demo lead created${assignedAgentId ? ' and assigned' : ''}`]
        );
        
        // Add some contact attempts for contacted leads
        if (lead.status === 'Contacted') {
          const contactAttempts = Math.floor(Math.random() * 2) + 1;
          await query('UPDATE leads SET contact_attempts = ? WHERE id = ?', [contactAttempts, leadId]);
          
          if (contactAttempts > 0) {
            await query(
              'INSERT INTO lead_history (lead_id, agent_id, action, notes) VALUES (?, ?, ?, ?)',
              [leadId, assignedAgentId, 'Contacted', `Contact attempt ${contactAttempts} recorded`]
            );
          }
        }
        
        console.log(`Added lead: ${lead.name} (${i + 1}/15)`);
      } else {
        console.log(`Lead already exists: ${lead.name}`);
      }
    }

    console.log('Demo data added successfully!');
    
    // Show summary
    const leadCount = await query('SELECT COUNT(*) as count FROM leads');
    const agentCount = await query('SELECT COUNT(*) as count FROM agents');
    
    console.log(`\nDatabase Summary:`);
    console.log(`Total Leads: ${leadCount[0].count}`);
    console.log(`Total Agents: ${agentCount[0].count}`);
    
  } catch (error) {
    console.error('Error adding demo data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addDemoData()
    .then(() => {
      console.log('Demo data script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo data script failed:', error);
      process.exit(1);
    });
}

module.exports = { addDemoData };
