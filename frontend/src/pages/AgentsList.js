import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  TrendingUp,
  Award,
  Target,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { agentsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import AgentCard from '../components/AgentCard';

const AgentsList = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { socket } = useSocket();

  const fetchAgents = async () => {
    try {
      const response = await agentsAPI.getAll();
      setAgents(response);
    } catch (error) {
      toast.error('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('stats:updated', fetchAgents);
      return () => {
        socket.off('stats:updated', fetchAgents);
      };
    }
  }, [socket]);

  const handleToggleActive = async (agentId, currentStatus) => {
    try {
      await agentsAPI.update(agentId, { is_active: !currentStatus });
      toast.success(`Agent ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchAgents();
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };

  const handleDelete = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      await agentsAPI.delete(agentId);
      toast.success('Agent deleted successfully');
      fetchAgents();
    } catch (error) {
      toast.error(error.message || 'Failed to delete agent');
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
                         agent.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && agent.is_active) ||
                         (filterStatus === 'inactive' && !agent.is_active);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.is_active).length,
    totalLeads: agents.reduce((sum, a) => sum + a.active_leads_count, 0),
    facebookAgents: agents.filter(a => a.can_handle_facebook).length
  };

  if (loading) {
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
          <h1 className="text-4xl font-bold gradient-text">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage your sales team and track performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-secondary flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary flex items-center space-x-2 shadow-xl"
          >
            <UserPlus className="h-5 w-5" />
            <span>Add Agent</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-gradient flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Agents</p>
            <p className="text-2xl font-bold gradient-text">{stats.total}</p>
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </div>
        <div className="card-gradient flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Agents</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
        <div className="card-gradient flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Leads</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalLeads}</p>
          </div>
          <Target className="h-8 w-8 text-purple-500" />
        </div>
        <div className="card-gradient flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Facebook Agents</p>
            <p className="text-2xl font-bold text-amber-600">{stats.facebookAgents}</p>
          </div>
          <Award className="h-8 w-8 text-amber-500" />
        </div>
      </div>

      {/* Filters */}
      <div className="card-gradient">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold gradient-text">Filters</h2>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {filteredAgents.length} of {agents.length} agents
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Search Agents</label>
            <div className="flex">
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input rounded-r-none"
              />
              <button className="btn btn-primary rounded-l-none">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="label">Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Agents</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Agent Form */}
      {showAddForm && (
        <div className="card-gradient animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold gradient-text">Add New Team Member</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <AddAgentForm
            onSuccess={() => {
              setShowAddForm(false);
              fetchAgents();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <div className="text-center py-12 card-gradient">
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {search || filterStatus !== 'all' ? 'No agents found' : 'No agents yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search || filterStatus !== 'all' 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by adding your first team member.'
            }
          </p>
          <div className="flex items-center justify-center space-x-3">
            {(search || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Agent
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={index}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Add Agent Form Component
const AddAgentForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    is_active: true,
    can_handle_facebook: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await agentsAPI.create(formData);
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="label">Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input"
            placeholder="john@example.com"
            required
          />
        </div>

        <div>
          <label className="label">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="flex items-center justify-center space-x-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Active Agent</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="can_handle_facebook"
              checked={formData.can_handle_facebook}
              onChange={handleChange}
              className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Facebook Leads</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Creating Agent...' : 'Create Agent'}
        </button>
      </div>
    </form>
  );
};

export default AgentsList;
