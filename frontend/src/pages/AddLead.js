import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Phone, Mail, Globe, User, Sparkles, Target, Users, Zap } from 'lucide-react';
import { leadsAPI, agentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const AddLead = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm();

  const watchedSource = watch('source');
  const watchedPriority = watch('priority');

  useEffect(() => {
    fetchAgents();
  }, []);

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
      if (!data.assigned_agent_id) {
        delete data.assigned_agent_id;
      }
      await leadsAPI.create(data);
      toast.success('Lead created successfully!');
      navigate('/leads');
    } catch (error) {
      toast.error(error.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const sources = [
    { value: 'Facebook', label: 'Facebook', icon: 'f', color: 'blue' },
    { value: 'Website', label: 'Website', icon: 'w', color: 'green' },
    { value: 'Referral', label: 'Referral', icon: 'r', color: 'purple' },
    { value: 'Email', label: 'Email', icon: '@', color: 'amber' },
    { value: 'Phone', label: 'Phone', icon: 'p', color: 'red' },
    { value: 'Walk-in', label: 'Walk-in', icon: 'w', color: 'indigo' },
    { value: 'Other', label: 'Other', icon: '?', color: 'gray' }
  ];

  const priorities = [
    { value: 'High', label: 'High Priority', color: 'red', icon: '!', description: 'Urgent - Immediate attention required' },
    { value: 'Medium', label: 'Medium Priority', color: 'amber', icon: 'N', description: 'Normal - Standard follow-up' },
    { value: 'Low', label: 'Low Priority', color: 'gray', icon: 'L', description: 'Low - Can wait for regular processing' }
  ];

  const getRecommendedAgent = () => {
    if (watchedSource === 'Facebook') {
      return agents.filter(a => a.can_handle_facebook).sort((a, b) => a.active_leads_count - b.active_leads_count)[0];
    }
    if (watchedPriority === 'High') {
      return agents.sort((a, b) => (b.converted_leads || 0) - (a.converted_leads || 0)).slice(0, 2)[0];
    }
    return agents.sort((a, b) => a.active_leads_count - b.active_leads_count)[0];
  };

  const recommendedAgent = getRecommendedAgent();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/leads')}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leads</span>
          </button>
          <div>
            <h1 className="text-4xl font-bold gradient-text">Create New Lead</h1>
            <p className="text-gray-600 mt-2">Add a new prospect to your sales pipeline</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="text-sm text-gray-600">Smart Assignment</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="card-gradient">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text">Lead Information</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Auto-save enabled</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-500" />
                  Basic Information
                </h3>

                {/* Name */}
                <div>
                  <label className="label">
                    <User className="inline-block h-4 w-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    className="input"
                    placeholder="Enter prospect's full name"
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
              </div>

              {/* Lead Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-500" />
                  Lead Details
                </h3>

                {/* Source */}
                <div>
                  <label className="label">
                    <Globe className="inline-block h-4 w-4 mr-2" />
                    Lead Source *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sources.map(source => (
                      <label key={source.value} className="relative">
                        <input
                          type="radio"
                          {...register('source', { required: 'Source is required' })}
                          value={source.value}
                          className="sr-only peer"
                        />
                        <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                          watchedSource === source.value
                            ? `border-${source.color}-500 bg-${source.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`w-8 h-8 bg-gradient-to-r from-${source.color}-400 to-${source.color}-500 rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
                              {source.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{source.label}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.source && (
                    <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="label">Priority Level</label>
                  <div className="space-y-3">
                    {priorities.map(priority => (
                      <label key={priority.value} className="relative">
                        <input
                          type="radio"
                          {...register('priority')}
                          value={priority.value}
                          className="sr-only peer"
                          defaultChecked={priority.value === 'Medium'}
                        />
                        <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                          watchedPriority === priority.value
                            ? `border-${priority.color}-500 bg-${priority.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 bg-gradient-to-r from-${priority.color}-400 to-${priority.color}-500 rounded-full flex items-center justify-center text-white font-bold`}>
                              {priority.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{priority.label}</div>
                              <div className="text-sm text-gray-500">{priority.description}</div>
                            </div>
                            {priority.value === 'High' && (
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-green-500" />
                  Additional Information
                </h3>

                <div>
                  <label className="label">Notes & Comments</label>
                  <textarea
                    {...register('notes')}
                    rows={4}
                    className="input"
                    placeholder="Add any additional information about this lead..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: Include context, previous interactions, or specific requirements
                  </p>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="btn btn-secondary"
                >
                  Clear Form
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="btn btn-secondary"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex items-center space-x-2 shadow-xl"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Creating...' : 'Create Lead'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Smart Assignment */}
          <div className="card-gradient">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold gradient-text flex items-center">
                <Zap className="h-5 w-5 mr-2 text-amber-500" />
                Smart Assignment
              </h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Assign to Agent</label>
                <select {...register('assigned_agent_id')} className="input">
                  <option value="">Auto-assign (Recommended)</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.active_leads_count} active leads)
                    </option>
                  ))}
                </select>
              </div>

              {recommendedAgent && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Recommended Agent</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <div className="font-medium">{recommendedAgent.name}</div>
                    <div className="text-green-600">
                      {recommendedAgent.active_leads_count} active leads
                      {recommendedAgent.can_handle_facebook && ' · Facebook enabled'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('assigned_agent_id', recommendedAgent.id)}
                    className="mt-3 w-full btn btn-success btn-sm"
                  >
                    Assign to {recommendedAgent.name}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Rules */}
          <div className="card-gradient">
            <h3 className="text-lg font-bold gradient-text mb-4">Assignment Rules</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Facebook Leads</div>
                  <div className="text-sm text-gray-600">Assigned to Facebook-capable agents only</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">High Priority</div>
                  <div className="text-sm text-gray-600">Distributed among top 2 performers</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Regular Leads</div>
                  <div className="text-sm text-gray-600">Assigned to least loaded agent</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-gray-900">Inactive Agents</div>
                  <div className="text-sm text-gray-600">Automatically skipped</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card-gradient">
            <h3 className="text-lg font-bold gradient-text mb-4">Team Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Agents</span>
                <span className="font-bold text-green-600">{agents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Active Leads</span>
                <span className="font-bold text-blue-600">
                  {agents.reduce((sum, a) => sum + a.active_leads_count, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Facebook Agents</span>
                <span className="font-bold text-amber-600">
                  {agents.filter(a => a.can_handle_facebook).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="card-gradient animate-slide-up">
          <h3 className="text-lg font-bold gradient-text mb-4">Advanced Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Expected Close Date</label>
              <input
                type="date"
                {...register('expected_close_date')}
                className="input"
              />
            </div>
            <div>
              <label className="label">Estimated Value</label>
              <input
                type="text"
                {...register('estimated_value')}
                className="input"
                placeholder="$0.00"
              />
            </div>
            <div>
              <label className="label">Campaign Source</label>
              <input
                type="text"
                {...register('campaign_source')}
                className="input"
                placeholder="e.g., Google Ads, Social Media"
              />
            </div>
            <div>
              <label className="label">Tags</label>
              <input
                type="text"
                {...register('tags')}
                className="input"
                placeholder="hot, vip, referral"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddLead;
