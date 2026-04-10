import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Mail,
  Phone,
  Activity,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';

const AgentCard = ({ agent, index, onToggleActive, onDelete }) => {
  const getPerformanceLevel = (activeLeads) => {
    if (activeLeads >= 10) return { level: 'Expert', color: 'green', icon: 'star' };
    if (activeLeads >= 5) return { level: 'Pro', color: 'blue', icon: 'check' };
    if (activeLeads >= 1) return { level: 'Active', color: 'amber', icon: 'circle' };
    return { level: 'Idle', color: 'gray', icon: 'moon' };
  };

  const performance = getPerformanceLevel(agent.active_leads_count);

  return (
    <div className="card-gradient hover-lift animate-fade-in relative" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className={`w-3 h-3 rounded-full ${
          agent.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}></div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r ${
            agent.is_active 
              ? 'from-green-400 to-green-500' 
              : 'from-gray-400 to-gray-500'
          } shadow-lg`}>
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-600">{agent.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                agent.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {agent.is_active ? 'Active' : 'Inactive'}
              </span>
              {agent.can_handle_facebook && (
                <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                  Facebook
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold gradient-text">{agent.active_leads_count}</div>
          <div className="text-xs text-gray-600">Active Leads</div>
        </div>
        <div className="bg-white/50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold text-${performance.color}-600`}>{performance.level}</div>
          <div className="text-xs text-gray-600">Performance</div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 mb-6">
        {agent.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center mr-3">
              <Phone className="h-4 w-4 text-blue-600" />
            </div>
            <span>{agent.phone}</span>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center mr-3">
            <Mail className="h-4 w-4 text-purple-600" />
          </div>
          <span>{agent.email}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-100 to-green-200 flex items-center justify-center mr-3">
            <Activity className="h-4 w-4 text-green-600" />
          </div>
          <span>{agent.active_leads_count} active leads</span>
        </div>
      </div>

      {/* Performance Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Workload</span>
          <span>{agent.active_leads_count}/10 leads</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r rounded-full transition-all duration-500 ${
              agent.active_leads_count >= 8 ? 'from-red-400 to-red-500' :
              agent.active_leads_count >= 5 ? 'from-amber-400 to-amber-500' :
              agent.active_leads_count >= 1 ? 'from-green-400 to-green-500' :
              'from-gray-400 to-gray-500'
            }`}
            style={{ width: `${Math.min(100, (agent.active_leads_count / 10) * 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <Link
            to={`/agents/${agent.id}`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/agents/${agent.id}/edit`}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleActive(agent.id, agent.is_active)}
            className={`p-2 rounded-lg transition-colors ${
              agent.is_active 
                ? 'text-gray-400 hover:bg-red-50 hover:text-red-600' 
                : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
            }`}
          >
            {agent.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => onDelete(agent.id)}
            className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Performance Badge */}
      {performance.level !== 'Idle' && (
        <div className="absolute top-2 left-2">
          <div className={`w-8 h-8 bg-gradient-to-r from-${performance.color}-400 to-${performance.color}-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
            {performance.level.charAt(0)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCard;
