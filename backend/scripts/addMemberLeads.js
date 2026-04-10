const { query, initializeDatabase } = require('../config/database');
const logger = require('../utils/logger');

const memberLeads = [
  {
    name: 'Thomas Anderson',
    phone: '555-0401',
    source: 'Website',
    priority: 'High',
    status: 'New',
    notes: 'Premium member interested in VIP services'
  },
  {
    name: 'Maria Rodriguez',
    phone: '555-0402',
    source: 'Facebook',
    priority: 'Medium',
    status: 'Contacted',
    notes: 'Member referral, looking for family package'
  },
  {
    name: 'James Wilson',
    phone: '555-0403',
    source: 'Referral',
    priority: 'High',
    status: 'Converted',
    notes: 'Gold member, upgraded to platinum'
  },
  {
    name: 'Patricia Brown',
    phone: '555-0404',
    source: 'Website',
    priority: 'Low',
    status: 'New',
    notes: 'Basic member inquiry'
  },
  {
    name: 'Robert Taylor',
    phone: '555-0405',
    source: 'Facebook',
    priority: 'High',
    status: 'Contacted',
    notes: 'VIP member requesting consultation'
  },
  {
    name: 'Linda Martinez',
    phone: '555-0406',
    source: 'Referral',
    priority: 'Medium',
    status: 'New',
    notes: 'Silver member interested in upgrade'
  },
  {
    name: 'William Davis',
    phone: '555-0407',
    source: 'Website',
    priority: 'High',
    status: 'Lost',
    notes: 'Member decided to cancel membership'
  },
  {
    name: 'Barbara Garcia',
    phone: '555-0408',
    source: 'Facebook',
    priority: 'Medium',
    status: 'Contacted',
    notes: 'Member needs assistance with account'
  },
  {
    name: 'Charles Miller',
    phone: '555-0409',
    source: 'Referral',
    priority: 'Low',
    status: 'New',
    notes: 'New member registration inquiry'
  },
  {
    name: 'Jennifer Lopez',
    phone: '555-0410',
    source: 'Website',
    priority: 'High',
    status: 'Converted',
    notes: 'Executive member, signed annual contract'
  }
];

async function addMemberLeads() {
  try {
    // Initialize database connection first
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    console.log('Adding 10 member leads...');
    
    // Get all active agents for assignment
    const agents = await query('SELECT id FROM agents WHERE is_active = true');
    
    if (agents.length === 0) {
      console.log('No active agents found, creating default agent...');
      // Create a default agent if none exist
      await query(
        'INSERT INTO agents (name, email, phone, is_active, can_handle_facebook) VALUES (?, ?, ?, ?, ?)',
        ['Default Agent', 'default@example.com', '555-9999', true, true]
      );
      const newAgents = await query('SELECT id FROM agents WHERE is_active = true');
      agents.push(...newAgents);
    }
    
    // Add member leads with random agent assignments
    for (let i = 0; i < memberLeads.length; i++) {
      const lead = memberLeads[i];
      
      // Check if lead already exists
      const existingLead = await query('SELECT id FROM leads WHERE phone = ?', [lead.phone]);
      
      if (existingLead.length === 0) {
        // Randomly assign to an agent or leave unassigned
        const assignedAgentId = Math.random() > 0.2 ? agents[Math.floor(Math.random() * agents.length)].id : null;
        
        const result = await query(
          'INSERT INTO leads (name, phone, source, priority, status, assigned_agent_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [lead.name, lead.phone, lead.source, lead.priority, lead.status, assignedAgentId, lead.notes]
        );
        
        const leadId = result.insertId || result[0].id;
        
        // Create history entry
        await query(
          'INSERT INTO lead_history (lead_id, agent_id, action, notes) VALUES (?, ?, ?, ?)',
          [leadId, assignedAgentId, 'Created', `Member lead created${assignedAgentId ? ' and assigned' : ''}`]
        );
        
        // Add some contact attempts for contacted leads
        if (lead.status === 'Contacted') {
          const contactAttempts = Math.floor(Math.random() * 3) + 1;
          await query('UPDATE leads SET contact_attempts = ? WHERE id = ?', [contactAttempts, leadId]);
          
          if (contactAttempts > 0) {
            await query(
              'INSERT INTO lead_history (lead_id, agent_id, action, notes) VALUES (?, ?, ?, ?)',
              [leadId, assignedAgentId, 'Contacted', `Member contact attempt ${contactAttempts} recorded`]
            );
          }
        }
        
        // Set last_contacted_at for contacted leads
        if (lead.status === 'Contacted') {
          await query('UPDATE leads SET last_contacted_at = CURRENT_TIMESTAMP WHERE id = ?', [leadId]);
        }
        
        console.log(`Added member lead: ${lead.name} (${i + 1}/10)`);
      } else {
        console.log(`Member lead already exists: ${lead.name}`);
      }
    }

    console.log('Member leads added successfully!');
    
    // Show summary
    const leadCount = await query('SELECT COUNT(*) as count FROM leads');
    const agentCount = await query('SELECT COUNT(*) as count FROM agents');
    
    console.log(`\nUpdated Database Summary:`);
    console.log(`Total Leads: ${leadCount[0]?.count || 0}`);
    console.log(`Total Agents: ${agentCount[0]?.count || 0}`);
    
  } catch (error) {
    console.error('Error adding member leads:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addMemberLeads()
    .then(() => {
      console.log('Member leads script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Member leads script failed:', error);
      process.exit(1);
    });
}

module.exports = { addMemberLeads };
