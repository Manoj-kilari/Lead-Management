import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Activity,
  TrendingUp,
  Users,
  PhoneCall,
  Edit,
  UserCheck,
  UserX,
  Calendar
} from 'lucide-react';
import { agentsAPI, leadsAPI } from '../services/api';
import toast from 'react-hot-toast';

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [agentLeads, setAgentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAgentData = async () => {
    try {
      const [agentData, performanceData, leadsData] = await Promise.all([
        agentsAPI.getById(id),
        agentsAPI.getPerformance(id),
        leadsAPI.getAll({ agent_id: id })
      ]);
      
      setAgent(agentData);
      setPerformance(performanceData);
      setAgentLeads(leadsData.leads);
    } catch (error) {
      toast.error('Failed to fetch agent details');
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, [id]);

  const handleToggleActive = async () => {
    try {
      await agentsAPI.update(id, { is_active: !agent.is_active });
      toast.success(`Agent ${agent.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchAgentData();
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Agent not found</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    return agent.is_active 
      ? 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800'
      : 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
  };

  const getLeadStatusBadge = (status) => {
    const statusClasses = {
      'New': 'status-new',
      'Contacted': 'status-contacted',
      'Converted': 'status-converted',
      'Lost': 'status-lost'
    };
    return `status-badge ${statusClasses[status] || ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/agents')}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Agents</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Agent Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Agent Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Card */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  agent.is_active ? 'bg-success-100' : 'bg-gray-100'
                }`}>
                  <User className={`h-6 w-6 ${
                    agent.is_active ? 'text-success-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">{agent.name}</h2>
                  <p className="text-gray-600">{agent.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={getStatusBadge()}>
                  {agent.is_active ? 'Active' : 'Inactive'}
                </span>
                {agent.can_handle_facebook && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Facebook Leads
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {agent.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {agent.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {agent.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Joined: {new Date(agent.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Activity className="h-4 w-4 mr-2" />
                  {agent.active_leads_count} active leads
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {performance?.total_leads || 0} total leads
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {performance?.conversion_rate || 0}% conversion rate
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={handleToggleActive}
                  className={`btn flex items-center space-x-2 ${
                    agent.is_active ? 'btn-warning' : 'btn-success'
                  }`}
                >
                  {agent.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  <span>{agent.is_active ? 'Deactivate' : 'Activate'}</span>
                </button>
                <button
                  onClick={() => navigate(`/agents/${id}/edit`)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          {performance && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{performance.total_leads}</div>
                  <div className="text-sm text-gray-600">Total Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600">{performance.active_leads}</div>
                  <div className="text-sm text-gray-600">Active Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">{performance.converted_leads}</div>
                  <div className="text-sm text-gray-600">Converted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger-600">{performance.lost_leads}</div>
                  <div className="text-sm text-gray-600">Lost</div>
                </div>
              </div>
            </div>
          )}

          {/* Agent's Leads */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Leads</h3>
            {agentLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agentLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-500">{lead.phone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={getLeadStatusBadge(lead.status)}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {lead.priority}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <PhoneCall className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads assigned</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This agent doesn't have any leads assigned yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Leads</span>
                <span className="text-sm font-medium text-gray-900">{agent.active_leads_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Leads</span>
                <span className="text-sm font-medium text-gray-900">{performance?.total_leads || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="text-sm font-medium text-green-600">{performance?.conversion_rate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Facebook Capable</span>
                <span className={`text-sm font-medium ${agent.can_handle_facebook ? 'text-blue-600' : 'text-gray-400'}`}>
                  {agent.can_handle_facebook ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
            <div className="space-y-2">
              <button
                onClick={handleToggleActive}
                className={`w-full btn flex items-center justify-center space-x-2 ${
                  agent.is_active ? 'btn-warning' : 'btn-success'
                }`}
              >
                {agent.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                <span>{agent.is_active ? 'Deactivate Agent' : 'Activate Agent'}</span>
              </button>
              
              <button
                onClick={() => navigate(`/agents/${id}/edit`)}
                className="w-full btn btn-secondary flex items-center justify-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Agent</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
