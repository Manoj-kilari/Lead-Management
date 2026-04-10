import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  Award,
  Users,
  PhoneCall,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/ai/dashboard/ai-insights');
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Mock data for demonstration
  const mockInsights = {
    top_scoring_leads: [
      { leadId: 1, leadName: 'Alice Johnson', score: 95, grade: 'A+', probability: 0.85 },
      { leadId: 2, leadName: 'Bob Wilson', score: 88, grade: 'A', probability: 0.72 },
      { leadId: 3, leadName: 'Carol Davis', score: 82, grade: 'B+', probability: 0.68 }
    ],
    leaderboard: [
      { agentId: 1, agentName: 'John Doe', score: 450, breakdown: { conversions: 45, response_time: 30, engagement: 25, quality: 20, bonuses: 15 } },
      { agentId: 2, agentName: 'Jane Smith', score: 380, breakdown: { conversions: 38, response_time: 25, engagement: 20, quality: 18, bonuses: 12 } }
    ],
    team_stats: {
      total_agents: 5,
      active_agents: 4,
      total_conversions: 83,
      total_active_leads: 127,
      average_score: 415
    },
    automation_stats: {
      total_rules: 8,
      active_rules: 8,
      recent_executions: 156,
      success_rate: 94
    }
  };

  const data = insights || mockInsights;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text flex items-center">
            <Brain className="h-8 w-8 mr-3 text-purple-500" />
            AI Insights Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Advanced analytics and predictive insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-secondary flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex space-x-2">
        {['overview', 'leads', 'agents', 'automation'].map(view => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedView === view
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-gradient flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Score Average</p>
                <p className="text-2xl font-bold gradient-text">82.5</p>
                <p className="text-xs text-green-600">+5.2% from last week</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
            <div className="card-gradient flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">68.4%</p>
                <p className="text-xs text-green-600">+3.1% improvement</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="card-gradient flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Performance</p>
                <p className="text-2xl font-bold text-blue-600">415</p>
                <p className="text-xs text-blue-600">Average score</p>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
            <div className="card-gradient flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Automation Success</p>
                <p className="text-2xl font-bold text-amber-600">94%</p>
                <p className="text-xs text-amber-600">156 executions</p>
              </div>
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Score Distribution */}
            <div className="card-gradient">
              <h3 className="text-lg font-bold gradient-text mb-4">Lead Score Distribution</h3>
              <div className="space-y-3">
                {['A+ (90-100)', 'A (80-89)', 'B (70-79)', 'C (60-69)', 'D (Below 60)'].map((grade, index) => {
                  const percentages = [15, 35, 30, 15, 5];
                  const colors = ['green', 'blue', 'amber', 'orange', 'red'];
                  return (
                    <div key={grade} className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-24">{grade}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-${colors[index]}-400 to-${colors[index]}-500 rounded-full transition-all duration-500`}
                          style={{ width: `${percentages[index]}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{percentages[index]}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Performance Chart */}
            <div className="card-gradient">
              <h3 className="text-lg font-bold gradient-text mb-4">Team Performance</h3>
              <div className="space-y-3">
                {data.leaderboard.map((agent, index) => (
                  <div key={agent.agentId} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 w-32">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium truncate">{agent.agentName}</span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(agent.score / 500) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{agent.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads View */}
      {selectedView === 'leads' && (
        <div className="space-y-6">
          <div className="card-gradient">
            <h3 className="text-xl font-bold gradient-text mb-6">Top Scoring Leads</h3>
            <div className="space-y-4">
              {data.top_scoring_leads.map((lead, index) => (
                <div key={lead.leadId} className="p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${
                        lead.grade === 'A+' ? 'from-green-400 to-green-500' :
                        lead.grade === 'A' ? 'from-blue-400 to-blue-500' :
                        'from-amber-400 to-amber-500'
                      } flex items-center justify-center text-white font-bold`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{lead.leadName}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            lead.grade === 'A+' ? 'bg-green-100 text-green-800' :
                            lead.grade === 'A' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            Grade: {lead.grade}
                          </span>
                          <span className="text-sm text-gray-600">Score: {lead.score}/100</span>
                          <span className="text-sm text-gray-600">
                            {(lead.probability * 100).toFixed(1)}% conversion probability
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-blue-600 cursor-pointer" />
                      <Target className="h-4 w-4 text-purple-600 cursor-pointer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agents View */}
      {selectedView === 'agents' && (
        <div className="space-y-6">
          <div className="card-gradient">
            <h3 className="text-xl font-bold gradient-text mb-6">Agent Performance Leaderboard</h3>
            <div className="space-y-4">
              {data.leaderboard.map((agent, index) => (
                <div key={agent.agentId} className="p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{agent.agentName}</h4>
                        <p className="text-sm text-gray-600">Total Score: {agent.score} points</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold gradient-text">{agent.score}</div>
                      <div className="text-sm text-gray-600">points</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{agent.breakdown.conversions}</div>
                      <div className="text-gray-500">Conversions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{agent.breakdown.response_time}</div>
                      <div className="text-gray-500">Response</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-amber-600">{agent.breakdown.engagement}</div>
                      <div className="text-gray-500">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{agent.breakdown.quality}</div>
                      <div className="text-gray-500">Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">{agent.breakdown.bonuses}</div>
                      <div className="text-gray-500">Bonuses</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Automation View */}
      {selectedView === 'automation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-gradient">
              <h3 className="text-lg font-bold gradient-text mb-4">Automation Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Rules</span>
                  <span className="font-bold text-blue-600">{data.automation_stats.total_rules}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Rules</span>
                  <span className="font-bold text-green-600">{data.automation_stats.active_rules}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recent Executions</span>
                  <span className="font-bold text-amber-600">{data.automation_stats.recent_executions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-bold text-purple-600">{data.automation_stats.success_rate}%</span>
                </div>
              </div>
            </div>

            <div className="card-gradient">
              <h3 className="text-lg font-bold gradient-text mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { action: 'Lead priority increased', time: '2 mins ago', type: 'priority' },
                  { action: 'Auto-assignment completed', time: '5 mins ago', type: 'assignment' },
                  { action: 'Stale lead reassignment', time: '12 mins ago', type: 'reassignment' },
                  { action: 'Lost status auto-marked', time: '18 mins ago', type: 'status' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-white/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'priority' ? 'bg-red-500' :
                      activity.type === 'assignment' ? 'bg-blue-500' :
                      activity.type === 'reassignment' ? 'bg-amber-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                      <div className="text-xs text-gray-500">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
