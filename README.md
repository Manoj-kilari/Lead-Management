# Lead Management System

A comprehensive lead management system built with React.js, Node.js, Express, and MySQL/PostgreSQL.

## Tech Stack
- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: MySQL or PostgreSQL
- **Real-time**: WebSocket (Socket.io)

## Features

### Core Modules
1. **Leads Module**
   - Create leads with Name, Phone, Source, Priority
   - Track lead status: New, Contacted, Converted, Lost

2. **Agents Module**
   - Add agents
   - Maintain active leads count automatically
   - Skip inactive agents

3. **Smart Assignment Logic**
   - Assign to least loaded agent
   - High priority leads distributed among top 2 agents
   - Facebook leads assigned only to specific agents

### Advanced Logic
- Auto reassign lead if not updated within 2 hours
- Track contact attempts (max 3 before marking as Lost)
- Real-time updates via WebSocket

### Frontend
- Dashboard with total leads and agent stats
- Lead list with status update
- Agent list
- Add lead form

## Installation

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Database Setup
1. Create database named `lead_management`
2. Run the SQL scripts from `backend/database/schema.sql`

## API Endpoints

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `GET /api/leads/stats` - Get lead statistics

### Agents
- `GET /api/agents` - Get all agents
- `POST /api/agents` - Add new agent
- `PUT /api/agents/:id` - Update agent
- `GET /api/agents/stats` - Get agent statistics

## Database Schema

### Agents Table
- id (Primary Key)
- name
- email
- phone
- is_active
- can_handle_facebook
- created_at
- updated_at

### Leads Table
- id (Primary Key)
- name
- phone
- source
- priority (High, Medium, Low)
- status (New, Contacted, Converted, Lost)
- assigned_agent_id (Foreign Key)
- contact_attempts
- last_contacted_at
- created_at
- updated_at

### Lead History Table
- id (Primary Key)
- lead_id (Foreign Key)
- agent_id (Foreign Key)
- action
- notes
- created_at
