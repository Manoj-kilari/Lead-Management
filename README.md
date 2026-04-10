# Lead Management System

A comprehensive lead management system built with React.js, Node.js, Express, and MySQL/PostgreSQL with real-time updates and intelligent lead assignment.

## Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL or PostgreSQL
- **Real-time**: WebSocket (Socket.io)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi
- **Logging**: Winston
- **Scheduling**: Node-cron

## Features

### Core Modules
1. **Leads Module**
   - Create leads with Name, Phone, Source, Priority
   - Track lead status: New, Contacted, Converted, Lost
   - View lead history and contact attempts
   - Lead filtering and pagination

2. **Agents Module**
   - Add and manage agents
   - Track active leads count automatically
   - Activate/deactivate agents
   - Performance metrics and tracking

3. **Smart Assignment Logic**
   - Assign to least loaded agent
   - High priority leads distributed among top 2 agents
   - Facebook leads assigned only to specific agents
   - Skip inactive agents

### Advanced Logic
- Auto reassign lead if not updated within 2 hours
- Track contact attempts (max 3 before marking as Lost)
- Real-time updates via WebSocket
- Lead history tracking

### Frontend Features
- Dashboard with statistics and quick actions
- Lead list with filtering and pagination
- Agent list with performance metrics
- Add lead form with smart assignment
- Lead detail view with status management
- Agent detail view with performance tracking

## Prerequisites

- Node.js (v14 or higher)
- MySQL or PostgreSQL
- npm or yarn

## Installation

### Database Setup

#### Option 1: MySQL
1. Create a database named `lead_management`
2. Run the schema file:
   ```bash
   cd backend
   mysql -u root -p lead_management < database/schema.sql
   ```

#### Option 2: PostgreSQL
1. Create a database named `lead_management`
2. Run the schema file:
   ```bash
   cd backend
   psql -U postgres -d lead_management -f database/schema_postgresql.sql
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure `.env` file:
   ```env
   # Database Configuration
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=lead_management

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure `.env` file (optional, defaults work for development):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

5. Start the frontend:
   ```bash
   npm start
   ```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Leads
- `GET /api/leads` - Get all leads (with filters)
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get lead by ID
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `PATCH /api/leads/:id/status` - Update lead status
- `POST /api/leads/:id/contact` - Record contact attempt
- `PATCH /api/leads/:id/reassign` - Reassign lead
- `GET /api/leads/stats/overview` - Get lead statistics
- `GET /api/leads/:id/history` - Get lead history

### Agents
- `GET /api/agents` - Get all agents
- `POST /api/agents` - Add new agent
- `GET /api/agents/:id` - Get agent by ID
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `GET /api/agents/stats/overview` - Get agent statistics
- `GET /api/agents/:id/performance` - Get agent performance

## WebSocket Events

### Lead Events
- `lead:created` - New lead created
- `lead:updated` - Lead updated
- `lead:status_updated` - Lead status changed
- `lead:contacted` - Contact attempt recorded
- `lead:reassigned` - Lead reassigned
- `lead:auto_reassigned` - Lead automatically reassigned

### Stats Events
- `stats:updated` - Statistics updated

## Database Schema

### Agents Table
- `id` (Primary Key)
- `name` - Agent name
- `email` - Agent email (unique)
- `phone` - Agent phone number
- `is_active` - Whether agent is active
- `can_handle_facebook` - Can handle Facebook leads
- `active_leads_count` - Count of active leads
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Leads Table
- `id` (Primary Key)
- `name` - Lead name
- `phone` - Lead phone number
- `source` - Lead source (Facebook, Website, etc.)
- `priority` - Lead priority (High, Medium, Low)
- `status` - Lead status (New, Contacted, Converted, Lost)
- `assigned_agent_id` - Assigned agent (Foreign Key)
- `contact_attempts` - Number of contact attempts
- `last_contacted_at` - Last contact timestamp
- `notes` - Additional notes
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Lead History Table
- `id` (Primary Key)
- `lead_id` - Lead ID (Foreign Key)
- `agent_id` - Agent ID (Foreign Key)
- `action` - Action performed
- `notes` - Action notes
- `created_at` - Creation timestamp

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in environment
2. Use a production database
3. Configure proper CORS settings
4. Use process manager like PM2

### Frontend
1. Build the application: `npm run build`
2. Serve static files with a web server
3. Configure API URL for production

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check database credentials in `.env`
   - Ensure database server is running
   - Verify database name exists

2. **CORS Error**
   - Check `FRONTEND_URL` in backend `.env`
   - Ensure frontend URL matches exactly

3. **Socket Connection Issues**
   - Check `REACT_APP_SOCKET_URL` in frontend `.env`
   - Verify backend is running on correct port

4. **Tailwind CSS Not Working**
   - Run `npm install` in frontend directory
   - Ensure PostCSS and Tailwind are properly configured

## License

MIT
