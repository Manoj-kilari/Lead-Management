const agentService = require('./services/agentService');
const { query, initializeDatabase } = require('./config/database');

(async () => {
  try {
    await initializeDatabase();
    
    console.log('=== DEBUGGING AGENT NOT FOUND ISSUE ===');
    
    // Test 1: Check if agents exist
    console.log('\n1. Checking if agents exist in database...');
    const allAgents = await query('SELECT * FROM agents');
    console.log(`Found ${allAgents.length} agents in database`);
    allAgents.forEach(agent => {
      console.log(`  - ID: ${agent.id}, Name: ${agent.name}, Active: ${agent.is_active}`);
    });
    
    // Test 2: Test getAgentById method
    console.log('\n2. Testing getAgentById method...');
    try {
      const agent1 = await agentService.getAgentById(1);
      console.log('Agent 1 found:', agent1 ? `${agent1.name} (${agent1.email})` : 'NOT FOUND');
      
      const agent2 = await agentService.getAgentById(2);
      console.log('Agent 2 found:', agent2 ? `${agent2.name} (${agent2.email})` : 'NOT FOUND');
      
      const agent3 = await agentService.getAgentById(999);
      console.log('Agent 999 found:', agent3 ? `${agent3.name} (${agent3.email})` : 'NOT FOUND (expected)');
    } catch (error) {
      console.error('Error in getAgentById:', error.message);
    }
    
    // Test 3: Test getAllAgents method
    console.log('\n3. Testing getAllAgents method...');
    try {
      const allAgentsList = await agentService.getAllAgents();
      console.log(`getAllAgents returned ${allAgentsList.length} agents`);
      allAgentsList.forEach(agent => {
        console.log(`  - ID: ${agent.id}, Name: ${agent.name}, Active: ${agent.is_active}, Leads: ${agent.active_leads_count}`);
      });
    } catch (error) {
      console.error('Error in getAllAgents:', error.message);
    }
    
    // Test 4: Test getActiveAgents method
    console.log('\n4. Testing getActiveAgents method...');
    try {
      const activeAgents = await agentService.getActiveAgents();
      console.log(`getActiveAgents returned ${activeAgents.length} active agents`);
      activeAgents.forEach(agent => {
        console.log(`  - ID: ${agent.id}, Name: ${agent.name}, Leads: ${agent.active_leads_count}`);
      });
    } catch (error) {
      console.error('Error in getActiveAgents:', error.message);
    }
    
    // Test 5: Check database query routing
    console.log('\n5. Testing direct database queries...');
    try {
      const testSql = 'SELECT * FROM agents WHERE id = ?';
      console.log('SQL pattern:', testSql);
      console.log('SQL lower:', testSql.toLowerCase());
      console.log('Contains "select":', testSql.toLowerCase().includes('select'));
      console.log('Contains "agents":', testSql.toLowerCase().includes('agents'));
      console.log('Contains "from agents a":', testSql.toLowerCase().includes('from agents a'));
      console.log('Contains "where":', testSql.toLowerCase().includes('where'));
      
      const directQuery = await query(testSql, [1]);
      console.log('Direct query result:', directQuery.length > 0 ? directQuery[0] : 'NO RESULTS');
    } catch (error) {
      console.error('Error in direct query:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('DEBUG ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
