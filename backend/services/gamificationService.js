const agentService = require('./agentService');
const leadService = require('./leadService');
const logger = require('../utils/logger');

class GamificationService {
  constructor() {
    this.achievements = {
      // Lead conversion achievements
      'first_conversion': { name: 'First Conversion', points: 50, icon: 'trophy' },
      'conversion_streak_5': { name: 'Hot Streak (5)', points: 100, icon: 'fire' },
      'conversion_streak_10': { name: 'On Fire (10)', points: 200, icon: 'rocket' },
      'monthly_champion': { name: 'Monthly Champion', points: 300, icon: 'crown' },
      
      // Lead management achievements
      'lead_master': { name: 'Lead Master', points: 75, icon: 'star' },
      'quick_responder': { name: 'Quick Responder', points: 40, icon: 'bolt' },
      'perfect_week': { name: 'Perfect Week', points: 150, icon: 'calendar' },
      
      // Special achievements
      'facebook_expert': { name: 'Facebook Expert', points: 60, icon: 'thumbs-up' },
      'priority_crusher': { name: 'Priority Crusher', points: 80, icon: 'target' },
      'comeback_king': { name: 'Comeback King', points: 120, icon: 'phoenix' }
    };
    
    this.leaderboardTypes = {
      'weekly': 'Weekly Leaderboard',
      'monthly': 'Monthly Leaderboard',
      'all_time': 'All-Time Leaderboard'
    };
  }

  // Calculate agent score for gamification
  async calculateAgentScore(agentId, period = 'weekly') {
    try {
      const agent = await agentService.getAgentById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const scoreBreakdown = {
        conversions: 0,
        response_time: 0,
        engagement: 0,
        quality: 0,
        bonuses: 0,
        total: 0
      };

      // 1. Conversion points (base 10 points per conversion)
      const conversions = await this.getAgentConversions(agentId, period);
      scoreBreakdown.conversions = conversions * 10;

      // 2. Response time points (faster = more points)
      const avgResponseTime = await this.getAverageResponseTime(agentId, period);
      if (avgResponseTime < 1) scoreBreakdown.response_time = 50; // Under 1 hour
      else if (avgResponseTime < 4) scoreBreakdown.response_time = 30; // Under 4 hours
      else if (avgResponseTime < 24) scoreBreakdown.response_time = 15; // Under 1 day
      else scoreBreakdown.response_time = 5; // Slow response

      // 3. Engagement points (based on contact quality)
      const engagementScore = await this.calculateEngagementScore(agentId, period);
      scoreBreakdown.engagement = engagementScore;

      // 4. Quality points (based on lead quality and retention)
      const qualityScore = await this.calculateQualityScore(agentId, period);
      scoreBreakdown.quality = qualityScore;

      // 5. Special bonuses
      const bonuses = await this.calculateBonuses(agentId, period);
      scoreBreakdown.bonuses = bonuses;

      // Calculate total
      scoreBreakdown.total = Object.values(scoreBreakdown).reduce((sum, val) => 
        typeof val === 'number' ? sum + val : sum, 0
      );

      return {
        agentId: agent.id,
        agentName: agent.name,
        period,
        score: scoreBreakdown.total,
        breakdown: scoreBreakdown,
        rank: null, // Will be calculated when getting leaderboard
        achievements: await this.getAgentAchievements(agentId)
      };
    } catch (error) {
      logger.error('Error calculating agent score:', error);
      throw error;
    }
  }

  // Get agent conversions in period
  async getAgentConversions(agentId, period) {
    // This would query the database for converted leads in the period
    // For now, return a mock calculation
    const agent = await agentService.getAgentById(agentId);
    return agent.converted_leads || 0;
  }

  // Calculate average response time
  async getAverageResponseTime(agentId, period) {
    // Calculate time from lead creation to first contact
    // For now, return a mock value
    return Math.random() * 24; // Random hours
  }

  // Calculate engagement score
  async calculateEngagementScore(agentId, period) {
    const agent = await agentService.getAgentById(agentId);
    
    // Base score from active leads
    let engagementScore = agent.active_leads_count * 5;
    
    // Bonus for high contact attempt ratio
    const totalLeads = agent.active_leads_count + (agent.converted_leads || 0) + (agent.lost_leads || 0);
    if (totalLeads > 0) {
      const contactRatio = (agent.active_leads_count * 3) / totalLeads; // Assuming 3 attempts per active lead
      if (contactRatio > 2.5) engagementScore += 30;
      else if (contactRatio > 2.0) engagementScore += 20;
      else if (contactRatio > 1.5) engagementScore += 10;
    }
    
    return Math.min(100, engagementScore);
  }

  // Calculate quality score
  async calculateQualityScore(agentId, period) {
    const agent = await agentService.getAgentById(agentId);
    
    let qualityScore = 0;
    
    // Conversion rate quality
    const totalLeads = agent.active_leads_count + (agent.converted_leads || 0);
    if (totalLeads > 0) {
      const conversionRate = (agent.converted_leads || 0) / totalLeads;
      if (conversionRate > 0.5) qualityScore += 50;
      else if (conversionRate > 0.3) qualityScore += 35;
      else if (conversionRate > 0.2) qualityScore += 20;
      else if (conversionRate > 0.1) qualityScore += 10;
    }
    
    // Facebook capability bonus
    if (agent.can_handle_facebook) qualityScore += 15;
    
    return Math.min(100, qualityScore);
  }

  // Calculate special bonuses
  async calculateBonuses(agentId, period) {
    let bonuses = 0;
    
    // Check for special achievements
    const achievements = await this.checkAgentAchievements(agentId);
    achievements.forEach(achievement => {
      bonuses += this.achievements[achievement]?.points || 0;
    });
    
    return bonuses;
  }

  // Check agent achievements
  async checkAgentAchievements(agentId) {
    const achievements = [];
    
    // Check various achievement conditions
    const agent = await agentService.getAgentById(agentId);
    
    // First conversion
    if (agent.converted_leads >= 1) {
      achievements.push('first_conversion');
    }
    
    // Facebook expert
    if (agent.can_handle_facebook && agent.active_leads_count > 0) {
      achievements.push('facebook_expert');
    }
    
    // Lead master (high active leads count)
    if (agent.active_leads_count >= 10) {
      achievements.push('lead_master');
    }
    
    return achievements;
  }

  // Get agent achievements
  async getAgentAchievements(agentId) {
    const achievements = await this.checkAgentAchievements(agentId);
    return achievements.map(key => ({
      key,
      ...this.achievements[key]
    }));
  }

  // Get leaderboard
  async getLeaderboard(type = 'weekly', limit = 10) {
    try {
      const agents = await agentService.getAllAgents();
      const scores = [];
      
      // Calculate scores for all agents
      for (const agent of agents) {
        const score = await this.calculateAgentScore(agent.id, type);
        scores.push(score);
      }
      
      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);
      
      // Assign ranks
      scores.forEach((score, index) => {
        score.rank = index + 1;
      });
      
      return scores.slice(0, limit);
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Get agent rank
  async getAgentRank(agentId, type = 'weekly') {
    const leaderboard = await this.getLeaderboard(type, 100); // Get more to find rank
    const agentScore = leaderboard.find(score => score.agentId === agentId);
    
    return agentScore ? agentScore.rank : null;
  }

  // Award achievement to agent
  async awardAchievement(agentId, achievementKey) {
    try {
      const achievement = this.achievements[achievementKey];
      if (!achievement) {
        throw new Error('Achievement not found');
      }
      
      // This would typically save to a database
      logger.info(`Achievement awarded to agent ${agentId}: ${achievement.name}`);
      
      return {
        agentId,
        achievement: {
          key: achievementKey,
          ...achievement
        },
        awarded_at: new Date()
      };
    } catch (error) {
      logger.error('Error awarding achievement:', error);
      throw error;
    }
  }

  // Get team statistics
  async getTeamStats() {
    try {
      const agents = await agentService.getAllAgents();
      
      const stats = {
        total_agents: agents.length,
        active_agents: agents.filter(a => a.is_active).length,
        total_conversions: agents.reduce((sum, a) => sum + (a.converted_leads || 0), 0),
        total_active_leads: agents.reduce((sum, a) => sum + a.active_leads_count, 0),
        average_score: 0,
        top_performer: null,
        most_improved: null,
        achievements_awarded: 0
      };
      
      // Calculate average score
      const weeklyScores = await this.getLeaderboard('weekly', agents.length);
      if (weeklyScores.length > 0) {
        stats.average_score = Math.round(
          weeklyScores.reduce((sum, score) => sum + score.score, 0) / weeklyScores.length
        );
        stats.top_performer = weeklyScores[0];
      }
      
      return stats;
    } catch (error) {
      logger.error('Error getting team stats:', error);
      throw error;
    }
  }

  // Create competition between agents
  async createCompetition(name, duration, type = 'conversions') {
    try {
      const competition = {
        id: Date.now().toString(),
        name,
        type,
        duration,
        start_date: new Date(),
        end_date: new Date(Date.now() + duration * 24 * 60 * 60 * 1000), // duration in days
        participants: [],
        status: 'active',
        rewards: {
          first_place: 500,
          second_place: 300,
          third_place: 100
        }
      };
      
      logger.info(`Competition created: ${name}`);
      return competition;
    } catch (error) {
      logger.error('Error creating competition:', error);
      throw error;
    }
  }
}

module.exports = new GamificationService();
