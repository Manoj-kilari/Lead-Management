import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  PhoneCall,
  Edit,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { leadsAPI, agentsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);
  const { socket } = useSocket();

  const fetchLead = async () => {
    try {
      const [leadData, historyData] = await Promise.all([
        leadsAPI.getById(id),
        leadsAPI.getHistory(id)
      ]);
      setLead(leadData);
      setHistory(historyData);
    } catch (error) {
      toast.error('Failed to fetch lead details');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await agentsAPI.getAll();
      setAgents(response.filter(agent => agent.is_active));
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  useEffect(() => {
    fetchLead();
    fetchAgents();
  }, [id]);

  useEffect(() => {
    if (socket) {
      socket.on('lead:updated', fetchLead);
      socket.on('lead:status_updated', fetchLead);
      socket.on('lead:contacted', fetchLead);
      socket.on('lead:reassigned', fetchLead);
      
      return () => {
        socket.off('lead:updated', fetchLead);
        socket.off('lead:status_updated', fetchLead);
        socket.off('lead:contacted', fetchLead);
        socket.off('lead:reassigned', fetchLead);
      };
    }
  }, [socket]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await leadsAPI.updateStatus(id, newStatus, `Status updated to ${newStatus}`);
      toast.success('Lead status updated successfully');
      fetchLead();
    } catch (error) {
      toast.error('Failed to update lead status');
    }
  };

  const handleContact = async (contactData) => {
    try {
      await leadsAPI.recordContact(id, contactData.notes, contactData.successful);
      toast.success('Contact attempt recorded');
      setShowContactForm(false);
      fetchLead();
    } catch (error) {
      toast.error('Failed to record contact attempt');
    }
  };

  const handleReassign = async (reassignData) => {
    try {
      await leadsAPI.reassign(id, reassignData.agent_id, reassignData.reason);
      toast.success('Lead reassigned successfully');
      setShowReassignForm(false);
      fetchLead();
    } catch (error) {
      toast.error('Failed to reassign lead');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'New': 'status-new',
      'Contacted': 'status-contacted',
      'Converted': 'status-converted',
      'Lost': 'status-lost'
    };
    return `status-badge ${statusClasses[status] || ''}`;
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      'High': 'priority-high',
      'Medium': 'priority-medium',
      'Low': 'priority-low'
    };
    return `status-badge ${priorityClasses[priority] || ''}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/leads')}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Leads</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Card */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{lead.name}</h2>
                <p className="text-gray-600">{lead.phone}</p>
              </div>
              <div className="flex space-x-2">
                <span className={getStatusBadge(lead.status)}>
                  {lead.status}
                </span>
                <span className={getPriorityBadge(lead.priority)}>
                  {lead.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  Source: {lead.source}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Agent: {lead.agent_name || 'Unassigned'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Contact Attempts: {lead.contact_attempts}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created: {new Date(lead.created_at).toLocaleDateString()}
                </div>
                {lead.last_contacted_at && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Last Contacted: {new Date(lead.last_contacted_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {lead.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{lead.notes}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {lead.status === 'New' && (
                  <button
                    onClick={() => handleStatusUpdate('Contacted')}
                    className="btn btn-warning flex items-center space-x-2"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>Mark as Contacted</span>
                  </button>
                )}
                
                {lead.status === 'Contacted' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('Converted')}
                      className="btn btn-success flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Mark as Converted</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('Lost')}
                      className="btn btn-danger flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Mark as Lost</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowContactForm(true)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Record Contact</span>
                </button>

                <button
                  onClick={() => setShowReassignForm(true)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reassign</span>
                </button>

                <button
                  onClick={() => navigate(`/leads/${id}/edit`)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contact History */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact History</h3>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.action}</p>
                        <p className="text-sm text-gray-600">{item.notes}</p>
                        {item.agent_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            By {item.agent_name}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No history available</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Form */}
          {showContactForm && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Contact</h3>
              <ContactForm
                onSubmit={handleContact}
                onCancel={() => setShowContactForm(false)}
              />
            </div>
          )}

          {/* Reassign Form */}
          {showReassignForm && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reassign Lead</h3>
              <ReassignForm
                agents={agents}
                currentAgentId={lead.assigned_agent_id}
                onSubmit={handleReassign}
                onCancel={() => setShowReassignForm(false)}
              />
            </div>
          )}

          {/* Lead Status Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {lead.status !== 'Converted' && (
                <button
                  onClick={() => handleStatusUpdate('Converted')}
                  className="w-full btn btn-success text-sm"
                >
                  Mark as Converted
                </button>
              )}
              {lead.status !== 'Lost' && lead.status !== 'Converted' && (
                <button
                  onClick={() => handleStatusUpdate('Lost')}
                  className="w-full btn btn-danger text-sm"
                >
                  Mark as Lost
                </button>
              )}
              {lead.status === 'Lost' && (
                <button
                  onClick={() => handleStatusUpdate('New')}
                  className="w-full btn btn-secondary text-sm"
                >
                  Reopen Lead
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Contact Form Component
const ContactForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    notes: '',
    successful: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Contact Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="input"
          rows={3}
          placeholder="Describe the contact attempt..."
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.successful}
            onChange={(e) => setFormData(prev => ({ ...prev, successful: e.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Contact was successful</span>
        </label>
      </div>

      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary text-sm">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary text-sm">
          Record Contact
        </button>
      </div>
    </form>
  );
};

// Reassign Form Component
const ReassignForm = ({ agents, currentAgentId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    agent_id: '',
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">New Agent</label>
        <select
          value={formData.agent_id}
          onChange={(e) => setFormData(prev => ({ ...prev, agent_id: e.target.value }))}
          className="input"
          required
        >
          <option value="">Select an agent</option>
          {agents
            .filter(agent => agent.id !== currentAgentId)
            .map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.active_leads_count} active leads)
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="label">Reason for Reassignment</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          className="input"
          rows={2}
          placeholder="Why is this lead being reassigned?"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary text-sm">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary text-sm">
          Reassign Lead
        </button>
      </div>
    </form>
  );
};

export default LeadDetail;
