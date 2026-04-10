import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Phone, Mail, Globe, User } from 'lucide-react';
import { leadsAPI, agentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const EditLead = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [currentLead, setCurrentLead] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  useEffect(() => {
    fetchLeadData();
    fetchAgents();
  }, [id]);

  const fetchLeadData = async () => {
    try {
      setFetchLoading(true);
      const lead = await leadsAPI.getById(id);
      setCurrentLead(lead);
      
      // Set form values
      setValue('name', lead.name);
      setValue('phone', lead.phone);
      setValue('source', lead.source);
      setValue('priority', lead.priority || 'Medium');
      setValue('assigned_agent_id', lead.assigned_agent_id || '');
      setValue('notes', lead.notes || '');
    } catch (error) {
      toast.error('Failed to fetch lead data');
      navigate('/leads');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/agents');
      const data = await response.json();
      setAgents(data.filter(agent => agent.is_active));
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // Remove assigned_agent_id if empty to avoid validation error
      if (!data.assigned_agent_id) {
        delete data.assigned_agent_id;
      }
      await leadsAPI.update(id, data);
      toast.success('Lead updated successfully!');
      navigate('/leads');
    } catch (error) {
      toast.error(error.message || 'Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  const sources = [
    'Facebook', 'Website', 'Referral', 'Email', 'Phone', 'Walk-in', 'Other'
  ];

  const priorities = [
    { value: 'High', label: 'High Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'Low', label: 'Low Priority' }
  ];

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="label">
                <User className="inline-block h-4 w-4 mr-2" />
                Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="input"
                placeholder="Enter lead name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="label">
                <Phone className="inline-block h-4 w-4 mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[+]?[\d\s\-\(\)]+$/,
                    message: 'Please enter a valid phone number'
                  },
                  minLength: {
                    value: 10,
                    message: 'Phone number must be at least 10 digits'
                  }
                })}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Source */}
            <div>
              <label className="label">
                <Globe className="inline-block h-4 w-4 mr-2" />
                Source *
              </label>
              <select
                {...register('source', { required: 'Source is required' })}
                className="input"
              >
                <option value="">Select a source</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              {errors.source && (
                <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="label">Priority</label>
              <div className="space-y-2">
                {priorities.map(priority => (
                  <label key={priority.value} className="flex items-center">
                    <input
                      type="radio"
                      {...register('priority')}
                      value={priority.value}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{priority.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Agent Assignment */}
            <div>
              <label className="label">
                <User className="inline-block h-4 w-4 mr-2" />
                Assign to Agent (Optional)
              </label>
              <select {...register('assigned_agent_id')} className="input">
                <option value="">Auto-assign (Recommended)</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.active_leads_count} active leads)
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Leave empty for automatic assignment based on workload and priority
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="label">
                <Mail className="inline-block h-4 w-4 mr-2" />
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="input"
                placeholder="Additional notes about this lead..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Add any additional information about this lead
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => reset(currentLead)}
                className="btn btn-secondary"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Updating...' : 'Update Lead'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLead;
