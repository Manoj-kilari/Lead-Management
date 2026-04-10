const leadService = require('./leadService');
const agentService = require('./agentService');
const logger = require('../utils/logger');

class AILeadScoringService {
  constructor() {
    this.scoringFactors = {
      // Source-based scoring (different sources have different quality)
      sourceScores: {
        'Referral': 90,      // Highest quality - personal recommendation
        'Website': 75,       // High quality - actively seeking
        'Email': 65,         // Medium quality - inbound interest
        'Facebook': 55,      // Medium quality - social media
        'Phone': 70,         // High quality - direct contact
        'Walk-in': 85,       // Very high quality - in-person
        'Other': 50          // Default scoring
      },
      
      // Priority-based scoring
      priorityScores: {
        'High': 25,
        'Medium': 15,
        'Low': 5
      },
      
      // Time-based scoring (fresher leads get higher scores)
      timeDecayHours: 72,   // 3 days decay period
      
      // Engagement-based scoring
      engagementFactors: {
        contactAttempts: -5,  // Each contact attempt reduces score
        recentActivity: 10,   // Recent activity increases score
        notesLength: 2       // Detailed notes indicate engagement
      }
    };
  }

  // Calculate lead score based on multiple factors
  async calculateLeadScore(leadId) {
    try {
      const lead = await leadService.getLeadById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      let score = 0;
      const factors = [];

      // 1. Base score from source
      const sourceScore = this.scoringFactors.sourceScores[lead.source] || 50;
      score += sourceScore;
      factors.push({ factor: 'Source', value: sourceScore, details: lead.source || 'Unknown' });

      // 2. Priority bonus
      const priorityScore = this.scoringFactors.priorityScores[lead.priority] || 0;
      score += priorityScore;
      factors.push({ factor: 'Priority', value: priorityScore, details: lead.priority || 'Unknown' });

      // 3. Time decay (newer leads get higher scores)
      const hoursSinceCreation = this.getHoursSinceCreation(lead.created_at);
      const timeScore = Math.max(0, 20 - (hoursSinceCreation / this.scoringFactors.timeDecayHours) * 20);
      score += timeScore;
      factors.push({ factor: 'Freshness', value: Math.round(timeScore), details: `${hoursSinceCreation}h old` });

      // 4. Engagement scoring
      const engagementScore = this.calculateEngagementScore(lead);
      score += engagementScore;
      factors.push({ factor: 'Engagement', value: engagementScore, details: `${lead.contact_attempts || 0} attempts` });

      // 5. Agent performance history (if assigned)
      if (lead.assigned_agent_id) {
        const agent = await agentService.getAgentById(lead.assigned_agent_id);
        if (agent) {
          const agentBonus = this.calculateAgentBonus(agent);
          score += agentBonus;
          factors.push({ factor: 'Agent Performance', value: agentBonus, details: agent.name });
        }
      }

      // 6. Sentiment analysis from notes
      const sentimentScore = this.analyzeSentiment(lead.notes || '');
      score += sentimentScore;
      factors.push({ factor: 'Sentiment', value: sentimentScore, details: 'Note analysis' });

      // Normalize score to 0-100 range
      const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

      return {
        leadId,
        score: normalizedScore,
        grade: this.getScoreGrade(normalizedScore),
        factors,
        calculated_at: new Date()
      };
    } catch (error) {
      logger.error('Error calculating lead score:', error);
      throw error;
    }
  }

  // Calculate engagement score based on contact attempts and activity
  calculateEngagementScore(lead) {
    let score = 0;
    
    // Penalty for too many contact attempts (indicates difficulty)
    const contactAttempts = lead.contact_attempts || 0;
    score -= Math.min(20, contactAttempts * this.scoringFactors.engagementFactors.contactAttempts);
    
    // Bonus for recent activity
    const hoursSinceUpdate = this.getHoursSinceCreation(lead.updated_at);
    if (hoursSinceUpdate < 24) {
      score += this.scoringFactors.engagementFactors.recentActivity;
    }
    
    // Bonus for detailed notes
    if (lead.notes && lead.notes.length > 50) {
      score += this.scoringFactors.engagementFactors.notesLength;
    }
    
    return score;
  }

  // Calculate agent performance bonus
  calculateAgentBonus(agent) {
    const conversionRate = agent.active_leads_count > 0 
      ? (agent.converted_leads || 0) / (agent.active_leads_count + (agent.converted_leads || 0))
      : 0;
    
    return Math.round(conversionRate * 15); // Max 15 points bonus
  }

  // Simple sentiment analysis for notes
  analyzeSentiment(notes) {
    if (!notes || notes.length < 10) return 0;
    
    const positiveWords = ['interested', 'excited', 'ready', 'eager', 'motivated', 'serious', 'committed', 'definitely', 'sure', 'yes'];
    const negativeWords = ['not interested', 'busy', 'later', 'maybe', 'think', 'consider', 'unsure', 'doubt', 'hesitant'];
    
    const lowerNotes = notes.toLowerCase();
    let sentimentScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerNotes.includes(word)) sentimentScore += 5;
    });
    
    negativeWords.forEach(word => {
      if (lowerNotes.includes(word)) sentimentScore -= 5;
    });
    
    return Math.max(-10, Math.min(10, sentimentScore));
  }

  // Get hours since creation
  getHoursSinceCreation(dateString) {
    const created = new Date(dateString);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60));
  }

  // Convert score to grade
  getScoreGrade(score) {
    if (score >= 85) return 'A+';
    if (score >= 75) return 'A';
    if (score >= 65) return 'B';
    if (score >= 55) return 'C';
    if (score >= 45) return 'D';
    return 'F';
  }

  // Batch score all leads
  async scoreAllLeads() {
    try {
      const allLeads = await leadService.getAllLeads({ limit: 1000 });
      const scores = [];
      
      for (const lead of allLeads.leads) {
        const score = await this.calculateLeadScore(lead.id);
        scores.push(score);
      }
      
      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);
      
      return scores;
    } catch (error) {
      logger.error('Error scoring all leads:', error);
      throw error;
    }
  }

  // Get top scoring leads
  async getTopScoringLeads(limit = 10) {
    const allScores = await this.scoreAllLeads();
    return allScores.slice(0, limit);
  }

  // Predict conversion probability
  async predictConversionProbability(leadId) {
    try {
      const score = await this.calculateLeadScore(leadId);
      
      // Map score to probability (simplified model)
      let probability = 0;
      
      if (score.score >= 85) probability = 0.85;
      else if (score.score >= 75) probability = 0.70;
      else if (score.score >= 65) probability = 0.55;
      else if (score.score >= 55) probability = 0.40;
      else if (score.score >= 45) probability = 0.25;
      else probability = 0.10;
      
      // Adjust based on lead status
      const lead = await leadService.getLeadById(leadId);
      if (lead.status === 'Contacted') probability += 0.15;
      if (lead.status === 'New') probability += 0.05;
      if (lead.status === 'Lost') probability = 0;
      
      return {
        leadId,
        probability: Math.min(0.95, Math.max(0.05, probability)),
        confidence: this.calculateConfidence(score),
        factors: score.factors,
        recommendation: this.getRecommendation(probability, lead.status)
      };
    } catch (error) {
      logger.error('Error predicting conversion probability:', error);
      throw error;
    }
  }

  // Calculate confidence level
  calculateConfidence(score) {
    const factorCount = score.factors.length;
    if (factorCount >= 6) return 'High';
    if (factorCount >= 4) return 'Medium';
    return 'Low';
  }

  // Get recommendation based on probability
  getRecommendation(probability, status) {
    if (probability >= 0.70) {
      return 'High priority - immediate follow-up recommended';
    } else if (probability >= 0.40) {
      return 'Medium priority - standard follow-up recommended';
    } else if (probability >= 0.20) {
      return 'Low priority - consider nurturing or reassignment';
    } else {
      return 'Very low priority - consider marking as lost';
    }
  }
}

module.exports = new AILeadScoringService();
