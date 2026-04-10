import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PhoneCall, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { leadsAPI, agentsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    leads: {},
    agents: {}
  });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchStats = async () => {
    try {
      const [leadsStats, agentsStats] = await Promise.all([
        leadsAPI.getStats(),
        agentsAPI.getStats()
      ]);
      
      setStats({
        leads: leadsStats,
        agents: agentsStats
      });
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('stats:updated', fetchStats);
      return () => {
        socket.off('stats:updated', fetchStats);
      };
    }
  }, [socket]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const leadStats = stats.leads || {};
  const agentStats = stats.agents || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Lead Management Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time insights and performance metrics</p>
        </div>
        <Link
          to="/leads/add"
          className="btn btn-primary flex items-center space-x-2 shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Lead</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={leadStats.total_leads || 0}
          icon={<PhoneCall className="h-6 w-6" />}
          color="primary"
          change={12}
          changeType="increase"
          trend={4}
        />
        
        <StatCard
          title="New Leads"
          value={leadStats.new_leads || 0}
          icon={<AlertCircle className="h-6 w-6" />}
          color="warning"
          change={8}
          changeType="increase"
          trend={3}
        />
        
        <StatCard
          title="Converted"
          value={leadStats.converted_leads || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="success"
          change={5}
          changeType="increase"
          trend={5}
        />
        
        <StatCard
          title="Active Agents"
          value={agentStats.active_agents || 0}
          icon={<Users className="h-6 w-6" />}
          color="purple"
          change={2}
          changeType="increase"
          trend={2}
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Breakdown */}
        <div className="card-gradient animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold gradient-text">Lead Status Distribution</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'New', value: leadStats.new_leads || 0, color: 'blue', icon: 'circle' },
              { label: 'Contacted', value: leadStats.contacted_leads || 0, color: 'amber', icon: 'phone' },
              { label: 'Converted', value: leadStats.converted_leads || 0, color: 'green', icon: 'check' },
              { label: 'Lost', value: leadStats.lost_leads || 0, color: 'red', icon: 'x' }
            ].map((status, index) => (
              <div key={status.label} className="flex items-center justify-between p-3 rounded-lg bg-white/50 hover:bg-white/70 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-${status.color}-400 to-${status.color}-500 flex items-center justify-center text-white text-xs font-bold`}>
                    {index + 1}
                  </div>
                  <span className="font-semibold text-gray-700">{status.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold gradient-text">{status.value}</div>
                  <div className={`w-16 h-2 bg-gray-200 rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full bg-gradient-to-r from-${status.color}-400 to-${status.color}-500 rounded-full animate-pulse-slow`}
                      style={{ width: `${Math.min(100, (status.value / Math.max(1, leadStats.total_leads || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority & Source Breakdown */}
        <div className="card-gradient animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold gradient-text">Priority & Source Analysis</h2>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'High Priority', value: leadStats.high_priority_leads || 0, color: 'red', urgency: 'critical' },
              { label: 'Medium Priority', value: leadStats.medium_priority_leads || 0, color: 'amber', urgency: 'normal' },
              { label: 'Facebook Leads', value: leadStats.facebook_leads || 0, color: 'blue', urgency: 'social' },
              { label: 'Unassigned', value: leadStats.unassigned_leads || 0, color: 'gray', urgency: 'pending' }
            ].map((item, index) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-white/50 hover:bg-white/70 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-${item.color}-400 to-${item.color}-500 flex items-center justify-center text-white text-xs font-bold`}>
                    {item.urgency === 'critical' ? '!' : item.urgency === 'social' ? 'f' : item.urgency === 'pending' ? '?' : 'N'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">{item.label}</span>
                    <div className="text-xs text-gray-500 capitalize">{item.urgency}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold gradient-text">{item.value}</div>
                  {item.urgency === 'critical' && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">
                      URGENT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-gradient animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gradient-text">Quick Actions</h2>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/leads/add"
            className="group flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 hover-lift border border-blue-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-gray-900 block">Add New Lead</span>
                <span className="text-xs text-gray-500">Create prospect</span>
              </div>
            </div>
          </Link>
          
          <Link
            to="/leads"
            className="group flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 hover-lift border border-green-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-gray-900 block">View All Leads</span>
                <span className="text-xs text-gray-500">Browse pipeline</span>
              </div>
            </div>
          </Link>
          
          <Link
            to="/agents"
            className="group flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl hover:from-purple-100 hover:to-indigo-100 transition-all duration-200 hover-lift border border-purple-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-gray-900 block">Manage Agents</span>
                <span className="text-xs text-gray-500">Team performance</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
