const cron = require('node-cron');
const logger = require('../utils/logger');
const config = require('../config');
const blogJob = require('../jobs/blogJob');

/**
 * Service for scheduling automated blog generation tasks
 */
class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }
  
  /**
   * Start the scheduler
   */
  startScheduler() {
    try {
      if (!config.scheduleEnabled) {
        logger.info('Scheduler is disabled in configuration');
        return;
      }
      
      const scheduleExpression = config.scheduleInterval;
      
      // Validate cron expression
      if (!cron.validate(scheduleExpression)) {
        logger.error(`Invalid cron expression: ${scheduleExpression}`);
        return;
      }
      
      // Schedule the main blog generation job
      this.scheduleJob('blogGeneration', scheduleExpression, async () => {
        try {
          await blogJob.generateAndPublishPost();
        } catch (error) {
          logger.error(`Error in scheduled blog generation: ${error.message}`);
        }
      });
      
      logger.info(`Scheduler started with interval: ${scheduleExpression}`);
    } catch (error) {
      logger.error(`Error starting scheduler: ${error.message}`);
    }
  }
  
  /**
   * Schedule a job
   * @param {string} jobName - The name of the job
   * @param {string} cronExpression - The cron expression
   * @param {Function} jobFunction - The function to execute
   */
  scheduleJob(jobName, cronExpression, jobFunction) {
    try {
      // Stop existing job if it exists
      if (this.jobs.has(jobName)) {
        this.jobs.get(jobName).stop();
        logger.info(`Stopped existing job: ${jobName}`);
      }
      
      // Create and start new job
      const job = cron.schedule(cronExpression, async () => {
        logger.info(`Running scheduled job: ${jobName}`);
        try {
          await jobFunction();
          logger.info(`Successfully completed scheduled job: ${jobName}`);
        } catch (error) {
          logger.error(`Error in scheduled job ${jobName}: ${error.message}`);
        }
      });
      
      // Store job reference
      this.jobs.set(jobName, job);
      logger.info(`Scheduled job: ${jobName} with expression: ${cronExpression}`);
      
      return job;
    } catch (error) {
      logger.error(`Error scheduling job ${jobName}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stop a scheduled job
   * @param {string} jobName - The name of the job to stop
   */
  stopJob(jobName) {
    try {
      if (this.jobs.has(jobName)) {
        this.jobs.get(jobName).stop();
        this.jobs.delete(jobName);
        logger.info(`Stopped job: ${jobName}`);
      } else {
        logger.warn(`Job not found: ${jobName}`);
      }
    } catch (error) {
      logger.error(`Error stopping job ${jobName}: ${error.message}`);
    }
  }
  
  /**
   * Stop all scheduled jobs
   */
  stopAllJobs() {
    try {
      for (const [jobName, job] of this.jobs.entries()) {
        job.stop();
        logger.info(`Stopped job: ${jobName}`);
      }
      this.jobs.clear();
      logger.info('Stopped all scheduled jobs');
    } catch (error) {
      logger.error(`Error stopping all jobs: ${error.message}`);
    }
  }
  
  /**
   * Run a job immediately
   * @param {string} jobName - The name of the job to run
   */
  async runJobNow(jobName) {
    try {
      if (jobName === 'blogGeneration') {
        logger.info('Running blog generation job now');
        return await blogJob.generateAndPublishPost();
      } else {
        throw new Error(`Unknown job: ${jobName}`);
      }
    } catch (error) {
      logger.error(`Error running job ${jobName}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SchedulerService();