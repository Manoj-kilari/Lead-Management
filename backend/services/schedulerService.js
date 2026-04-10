const assignmentService = require('./assignmentService');
const leadService = require('./leadService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.intervals = new Map();
  }

  // Start all scheduled tasks
  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    logger.info('Starting scheduler service...');
    this.isRunning = true;

    // Run stale lead reassignment every 30 minutes
    this.intervals.set('staleLeads', setInterval(async () => {
      try {
        await assignmentService.reassignStaleLeads();
      } catch (error) {
        logger.error('Error in scheduled stale lead reassignment:', error);
      }
    }, 30 * 60 * 1000)); // 30 minutes

    // Run auto Lost status processing every hour
    this.intervals.set('autoLost', setInterval(async () => {
      try {
        await assignmentService.processAutoLostLeads();
      } catch (error) {
        logger.error('Error in scheduled auto Lost processing:', error);
      }
    }, 60 * 60 * 1000)); // 1 hour

    // Run lead rebalancing every 2 hours
    this.intervals.set('rebalance', setInterval(async () => {
      try {
        await assignmentService.rebalanceLeads();
      } catch (error) {
        logger.error('Error in scheduled lead rebalancing:', error);
      }
    }, 2 * 60 * 60 * 1000)); // 2 hours

    logger.info('Scheduler service started with 3 scheduled tasks');
  }

  // Stop all scheduled tasks
  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    logger.info('Stopping scheduler service...');
    
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      logger.info(`Stopped ${name} interval`);
    });

    this.intervals.clear();
    this.isRunning = false;
    
    logger.info('Scheduler service stopped');
  }

  // Run all tasks manually (for testing or immediate execution)
  async runAllTasks() {
    logger.info('Running all scheduler tasks manually...');
    
    try {
      const staleResults = await assignmentService.reassignStaleLeads();
      const lostResults = await assignmentService.processAutoLostLeads();
      await assignmentService.rebalanceLeads();
      
      logger.info('All scheduler tasks completed successfully');
      return {
        staleLeads: staleResults,
        autoLost: lostResults,
        rebalance: 'completed'
      };
    } catch (error) {
      logger.error('Error running scheduler tasks:', error);
      throw error;
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeIntervals: this.intervals.size,
      tasks: Array.from(this.intervals.keys())
    };
  }
}

module.exports = new SchedulerService();
