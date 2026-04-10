import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Download,
  TrendingUp
} from 'lucide-react';
import { leadsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import LeadCard from '../components/LeadCard';

const LeadsList = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    source: '',
    agent_id: ''
  });
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [agents, setAgents] = useState([]);
  const { socket } = useSocket();

  const fetchLeads = async (page = 1) => {
    try {
      setLoading(true);
      const params = { ...filters, page, limit: pagination.limit };
      if (search) params.search = search;
      
      const response = await leadsAPI.getAll(params);
      setLeads(response.leads);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await leadsAPI.getAgents();
      setAgents(response);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    fetchLeads(1);
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'New': 'status-new',
      'Contacted': 'status-contacted',
      'Converted': 'status-converted',
      'Lost': 'status-lost'
    };
    return statusClasses[status] || '';
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      'High': 'priority-high',
      'Medium': 'priority-medium',
      'Low': 'priority-low'
    };
    return `status-badge ${priorityClasses[priority] || ''}`;
  };

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('lead:updated', fetchLeads);
      socket.on('lead:created', fetchLeads);
      socket.on('lead:deleted', fetchLeads);
      return () => {
        socket.off('lead:updated', fetchLeads);
        socket.off('lead:created', fetchLeads);
        socket.off('lead:deleted', fetchLeads);
      };
    }
  }, [socket]);

  if (loading && leads.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Lead Pipeline</h1>
          <p className="text-gray-600 mt-2">Manage and track your sales leads</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <Link to="/leads/add" className="btn btn-primary flex items-center space-x-2 shadow-xl">
            <Plus className="h-5 w-5" />
            <span>Add Lead</span>
          </Link>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="card-gradient">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold gradient-text">Advanced Filters</h2>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {Object.values(filters).filter(v => v).length} filters active
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="label">Search Leads</label>
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search by name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input rounded-r-none"
              />
              <button type="submit" className="btn btn-primary rounded-l-none">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
          
          <div>
            <label className="label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
          
          <div>
            <label className="label">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="input"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="label">Source</label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="input"
            >
              <option value="">All Sources</option>
              <option value="Website">Website</option>
              <option value="Facebook">Facebook</option>
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="Referral">Referral</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="label">Agent</label>
            <select
              value={filters.agent_id}
              onChange={(e) => handleFilterChange('agent_id', e.target.value)}
              className="input"
            >
              <option value="">All Agents</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-gradient flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Leads</p>
            <p className="text-2xl font-bold gradient-text">{pagination.total}</p>
          </div>
          <PhoneCall className="h-8 w-8 text-blue-500" />
        </div>
        <div className="card-gradient flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">New Leads</p>
            <p className="text-2xl font-bold text-blue-600">
              {leads.filter(l => l.status === 'New').length}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
        <div className="card-gradient flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">High Priority</p>
            <p className="text-2xl font-bold text-red-600">
              {leads.filter(l => l.priority === 'High').length}
            </p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
        </div>
        <div className="card-gradient flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {leads.length > 0 
                ? Math.round((leads.filter(l => l.status === 'Converted').length / leads.length) * 100)
                : 0}%
            </p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
        </div>
      </div>

      {/* Leads Grid */}
      {loading && leads.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 card-gradient">
          <PhoneCall className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-500 mb-6">
            {Object.values(filters).filter(v => v).length > 0 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding your first lead.'
            }
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setFilters({ status: '', priority: '', source: '', agent_id: '' })}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
            <Link to="/leads/add" className="btn btn-primary">
              Add Lead
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} index={index} />
            ))}
          </div>

          {/* Enhanced Pagination */}
          {pagination.pages > 1 && (
            <div className="card-gradient">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchLeads(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => fetchLeads(i + 1)}
                        className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                          pagination.page === i + 1
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => fetchLeads(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeadsList;
