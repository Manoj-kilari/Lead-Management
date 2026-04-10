const leadService = require('./leadService');
const agentService = require('./agentService');
const logger = require('../utils/logger');

class CollaborationService {
  constructor() {
    this.activeSessions = new Map(); // agentId -> session data
    this.teamNotes = new Map(); // leadId -> array of notes
    this.mentions = new Map(); // agentId -> array of mentions
  }

  // Create collaborative session for a lead
  async createCollaborativeSession(leadId, agentId, sessionType = 'review') {
    try {
      const lead = await leadService.getLeadById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      const session = {
        id: `${leadId}-${Date.now()}`,
        leadId,
        leadName: lead.name,
        createdBy: agentId,
        sessionType, // 'review', 'handoff', 'strategy'
        participants: [agentId],
        status: 'active',
        createdAt: new Date(),
        lastActivity: new Date(),
        sharedNotes: [],
        decisions: [],
        nextSteps: [],
        documents: []
      };

      this.activeSessions.set(session.id, session);
      
      logger.info(`Collaborative session created for lead ${leadId} by agent ${agentId}`);
      return session;
    } catch (error) {
      logger.error('Error creating collaborative session:', error);
      throw error;
    }
  }

  // Join existing collaborative session
  async joinSession(sessionId, agentId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.participants.includes(agentId)) {
        session.participants.push(agentId);
        session.lastActivity = new Date();
      }

      // Notify other participants (would use Socket.io in real implementation)
      this.notifyParticipants(sessionId, {
        type: 'participant_joined',
        agentId,
        timestamp: new Date()
      });

      return session;
    } catch (error) {
      logger.error('Error joining session:', error);
      throw error;
    }
  }

  // Add shared note to session
  async addSharedNote(sessionId, agentId, content, type = 'general') {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const note = {
        id: Date.now().toString(),
        agentId,
        content,
        type, // 'general', 'concern', 'decision', 'action'
        createdAt: new Date(),
        mentions: this.extractMentions(content)
      };

      session.sharedNotes.push(note);
      session.lastActivity = new Date();

      // Process mentions
      await this.processMentions(note.mentions, agentId, sessionId, content);

      // Notify participants
      this.notifyParticipants(sessionId, {
        type: 'note_added',
        note,
        timestamp: new Date()
      });

      return note;
    } catch (error) {
      logger.error('Error adding shared note:', error);
      throw error;
    }
  }

  // Extract @mentions from content
  extractMentions(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  // Process mentions and notify agents
  async processMentions(mentions, authorId, sessionId, content) {
    try {
      const agents = await agentService.getAllAgents();
      
      for (const mention of mentions) {
        const mentionedAgent = agents.find(agent => 
          agent.name.toLowerCase().includes(mention.toLowerCase()) ||
          agent.email.toLowerCase().includes(mention.toLowerCase())
        );
        
        if (mentionedAgent) {
          const mentionRecord = {
            id: Date.now().toString(),
            mentionedAgentId: mentionedAgent.id,
            mentionedAgentName: mentionedAgent.name,
            authorId,
            sessionId,
            content,
            createdAt: new Date(),
            read: false
          };
          
          if (!this.mentions.has(mentionedAgent.id)) {
            this.mentions.set(mentionedAgent.id, []);
          }
          this.mentions.get(mentionedAgent.id).push(mentionRecord);
          
          logger.info(`Agent ${mentionedAgent.name} mentioned in session ${sessionId}`);
        }
      }
    } catch (error) {
      logger.error('Error processing mentions:', error);
    }
  }

  // Add decision to session
  async addDecision(sessionId, agentId, decision, actionItems = []) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const decisionRecord = {
        id: Date.now().toString(),
        agentId,
        decision,
        actionItems,
        createdAt: new Date(),
        status: 'pending'
      };

      session.decisions.push(decisionRecord);
      session.lastActivity = new Date();

      // Convert action items to next steps
      actionItems.forEach(item => {
        session.nextSteps.push({
          id: Date.now().toString() + Math.random(),
          description: item,
          assignedTo: agentId,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
          status: 'pending',
          createdBy: agentId
        });
      });

      this.notifyParticipants(sessionId, {
        type: 'decision_added',
        decision: decisionRecord,
        timestamp: new Date()
      });

      return decisionRecord;
    } catch (error) {
      logger.error('Error adding decision:', error);
      throw error;
    }
  }

  // Get agent's notifications
  async getAgentNotifications(agentId) {
    try {
      const notifications = [];
      
      // Get mentions
      const agentMentions = this.mentions.get(agentId) || [];
      notifications.push(...agentMentions.map(mention => ({
        id: mention.id,
        type: 'mention',
        message: `You were mentioned in a discussion`,
        details: mention.content,
        sessionId: mention.sessionId,
        createdAt: mention.createdAt,
        read: mention.read
      })));

      // Get session invitations (would come from database in real implementation)
      // This is a placeholder for demonstration
      
      return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      logger.error('Error getting agent notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationRead(agentId, notificationId) {
    try {
      const mentions = this.mentions.get(agentId) || [];
      const mention = mentions.find(m => m.id === notificationId);
      
      if (mention) {
        mention.read = true;
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get active sessions for agent
  async getAgentSessions(agentId) {
    try {
      const sessions = [];
      
      for (const [sessionId, session] of this.activeSessions) {
        if (session.participants.includes(agentId)) {
          sessions.push(session);
        }
      }
      
      return sessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    } catch (error) {
      logger.error('Error getting agent sessions:', error);
      throw error;
    }
  }

  // Create team note for lead
  async createTeamNote(leadId, agentId, content, visibility = 'team') {
    try {
      const lead = await leadService.getLeadById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      const teamNote = {
        id: Date.now().toString(),
        leadId,
        leadName: lead.name,
        agentId,
        content,
        visibility, // 'team', 'private', 'manager'
        createdAt: new Date(),
        updatedAt: new Date(),
        mentions: this.extractMentions(content)
      };

      if (!this.teamNotes.has(leadId)) {
        this.teamNotes.set(leadId, []);
      }
      this.teamNotes.get(leadId).push(teamNote);

      // Process mentions
      await this.processMentions(teamNote.mentions, agentId, null, content);

      logger.info(`Team note created for lead ${leadId} by agent ${agentId}`);
      return teamNote;
    } catch (error) {
      logger.error('Error creating team note:', error);
      throw error;
    }
  }

  // Get team notes for lead
  async getTeamNotes(leadId, agentId) {
    try {
      const notes = this.teamNotes.get(leadId) || [];
      
      // Filter based on visibility
      const filteredNotes = notes.filter(note => {
        if (note.visibility === 'team') return true;
        if (note.visibility === 'private') return note.agentId === agentId;
        if (note.visibility === 'manager') {
          // Would check if agent is manager in real implementation
          return true;
        }
        return true;
      });

      return filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      logger.error('Error getting team notes:', error);
      throw error;
    }
  }

  // Notify participants (would use Socket.io in real implementation)
  notifyParticipants(sessionId, event) {
    // This would emit Socket.io events to all participants
    logger.info(`Notification sent to session ${sessionId}: ${event.type}`);
  }

  // End collaborative session
  async endSession(sessionId, agentId, reason = 'completed') {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'ended';
      session.endedAt = new Date();
      session.endedBy = agentId;
      session.endReason = reason;

      // Notify participants
      this.notifyParticipants(sessionId, {
        type: 'session_ended',
        agentId,
        reason,
        timestamp: new Date()
      });

      // Remove from active sessions after a delay
      setTimeout(() => {
        this.activeSessions.delete(sessionId);
      }, 60000); // Keep for 1 minute for final notifications

      logger.info(`Session ${sessionId} ended by agent ${agentId}: ${reason}`);
      return session;
    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  // Get collaboration statistics
  async getCollaborationStats() {
    try {
      const stats = {
        active_sessions: this.activeSessions.size,
        total_notes: Array.from(this.teamNotes.values()).reduce((sum, notes) => sum + notes.length, 0),
        total_mentions: Array.from(this.mentions.values()).reduce((sum, mentions) => sum + mentions.length, 0),
        unread_mentions: Array.from(this.mentions.values()).reduce((sum, mentions) => 
          sum + mentions.filter(m => !m.read).length, 0
        )
      };

      return stats;
    } catch (error) {
      logger.error('Error getting collaboration stats:', error);
      throw error;
    }
  }
}

module.exports = new CollaborationService();
