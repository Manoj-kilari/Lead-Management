import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  User,
  Calendar,
  Eye,
  Edit,
  MessageCircle,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';

const LeadCard = ({ lead, index }) => {
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High':
        return <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>;
      case 'Medium':
        return <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>;
      case 'Low':
        return <div className="w-3 h-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'New':
        return <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>;
      case 'Contacted':
        return <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>;
      case 'Converted':
        return <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>;
      case 'Lost':
        return <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full"></div>;
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'Facebook':
        return <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">f</div>;
      case 'Website':
        return <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded text-white text-xs flex items-center justify-center font-bold">w</div>;
      case 'Email':
        return <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">@</div>;
      case 'Phone':
        return <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded text-white text-xs flex items-center justify-center font-bold">p</div>;
      default:
        return <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded text-white text-xs flex items-center justify-center font-bold">?</div>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="card-gradient hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-center space-y-1">
            {getStatusIcon(lead.status)}
            {getPriorityIcon(lead.priority)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center text-gray-500">
                <Phone className="h-4 w-4 mr-1" />
                <span className="text-sm">{lead.phone}</span>
              </div>
              {getSourceIcon(lead.source)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`status-badge ${lead.status.toLowerCase().replace(' ', '-')}`}>
            {lead.status}
          </span>
          <span className={`priority-badge priority-${lead.priority.toLowerCase()}`}>
            {lead.priority}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{lead.agent_name || 'Unassigned'}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(lead.created_at)}</span>
        </div>
      </div>

      {lead.notes && (
        <div className="mb-4 p-3 bg-white/50 rounded-lg">
          <p className="text-sm text-gray-600 line-clamp-2">{lead.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4" />
            <span>{lead.contact_attempts || 0} attempts</span>
          </div>
          {lead.status === 'Converted' && (
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>Converted</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/leads/${lead.id}`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/leads/${lead.id}/edit`}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span>{lead.status === 'Converted' ? '100%' : lead.status === 'Contacted' ? '50%' : '25%'}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r rounded-full transition-all duration-500 ${
              lead.status === 'Converted' 
                ? 'from-green-400 to-green-500' 
                : lead.status === 'Contacted' 
                ? 'from-amber-400 to-amber-500'
                : 'from-blue-400 to-blue-500'
            }`}
            style={{ 
              width: lead.status === 'Converted' ? '100%' : lead.status === 'Contacted' ? '50%' : '25%' 
            }}
          />
        </div>
      </div>

      {/* Urgency indicator */}
      {lead.priority === 'High' && lead.status === 'New' && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          <div className="w-2 h-2 bg-red-500 rounded-full absolute top-0 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default LeadCard;
