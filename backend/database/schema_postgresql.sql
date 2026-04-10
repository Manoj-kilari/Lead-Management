-- Lead Management System Database Schema for PostgreSQL

-- Agents Table
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    can_handle_facebook BOOLEAN DEFAULT FALSE,
    active_leads_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads Table
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    source VARCHAR(100) NOT NULL,
    priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status VARCHAR(15) DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Converted', 'Lost')),
    assigned_agent_id INT,
    contact_attempts INT DEFAULT 0,
    last_contacted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- Lead History Table
CREATE TABLE lead_history (
    id SERIAL PRIMARY KEY,
    lead_id INT NOT NULL,
    agent_id INT,
    action VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_agent ON leads(assigned_agent_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_agents_active ON agents(is_active);
CREATE INDEX idx_lead_history_lead_id ON lead_history(lead_id);
CREATE INDEX idx_lead_history_created_at ON lead_history(created_at);

-- Trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample Data
INSERT INTO agents (name, email, phone, is_active, can_handle_facebook) VALUES
('John Smith', 'john@example.com', '555-0101', TRUE, TRUE),
('Sarah Johnson', 'sarah@example.com', '555-0102', TRUE, TRUE),
('Mike Wilson', 'mike@example.com', '555-0103', TRUE, FALSE),
('Emma Davis', 'emma@example.com', '555-0104', TRUE, FALSE);

INSERT INTO leads (name, phone, source, priority, status) VALUES
('Alice Brown', '555-0201', 'Facebook', 'High', 'New'),
('Bob Wilson', '555-0202', 'Website', 'Medium', 'New'),
('Carol Johnson', '555-0203', 'Referral', 'Low', 'Contacted'),
('David Lee', '555-0204', 'Facebook', 'High', 'Converted');
