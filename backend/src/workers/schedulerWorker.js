const ScheduledPost = require('../models/ScheduledPost');
const Post = require('../models/Post');
const ActivityEvent = require('../models/ActivityEvent');

/**
 * SchedulerWorker — Processes scheduled posts and publishes them at the right time.
 * Runs on a configurable interval (default: every 60 seconds).
 */
class SchedulerWorker {
  static interval = null;

  /**
   * Start the scheduler worker.
   */
  static start(intervalMs = 60 * 1000) {
    console.log('[SchedulerWorker] Starting scheduled post processor...');
    this.interval = setInterval(() => this.processScheduledPosts(), intervalMs);
    // Run immediately on start
    this.processScheduledPosts();
  }

  /**
   * Stop the scheduler worker.
   */
  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[SchedulerWorker] Stopped.');
    }
  }

  /**
   * Process all scheduled posts that are due.
   */
  static async processScheduledPosts() {
    try {
      const now = new Date();

      // Find all posts due for publishing
      const dueScheduled = await ScheduledPost.find({
        status: 'scheduled',
        scheduledFor: { $lte: now },
      })
        .populate('post')
        .limit(50); // Process in batches

      if (dueScheduled.length === 0) return;

      console.log(`[SchedulerWorker] Processing ${dueScheduled.length} scheduled posts...`);

      for (const scheduled of dueScheduled) {
        try {
          await this._publishScheduledPost(scheduled);
        } catch (err) {
          console.error(`[SchedulerWorker] Failed to publish scheduled post ${scheduled._id}:`, err.message);

          // Increment retry count
          scheduled.retryCount += 1;
          if (scheduled.retryCount >= scheduled.maxRetries) {
            scheduled.status = 'failed';
            scheduled.failureReason = err.message;
          }
          await scheduled.save();
        }
      }
    } catch (err) {
      console.error('[SchedulerWorker] Error processing scheduled posts:', err.message);
    }
  }

  /**
   * Publish a single scheduled post.
   */
  static async _publishScheduledPost(scheduled) {
    const post = await Post.findById(scheduled.post._id || scheduled.post);
    if (!post) {
      scheduled.status = 'failed';
      scheduled.failureReason = 'Post not found';
      await scheduled.save();
      return;
    }

    // Publish the post
    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();

    // Update schedule status
    scheduled.status = 'published';
    scheduled.publishedAt = new Date();
    await scheduled.save();

    // Create activity event
    await ActivityEvent.create({
      creator: scheduled.creator,
      eventType: 'content_trending', // reuse for scheduled publish notification
      post: post._id,
      postTitle: post.title,
      message: `Scheduled post "${post.title}" has been published`,
    });

    console.log(`[SchedulerWorker] Published: "${post.title}" (scheduled by ${scheduled.creator})`);

    // Handle recurring posts
    if (scheduled.recurring && scheduled.recurrencePattern) {
      await this._createNextRecurrence(scheduled);
    }
  }

  /**
   * Create the next occurrence for a recurring scheduled post.
   */
  static async _createNextRecurrence(scheduled) {
    const nextDate = new Date(scheduled.scheduledFor);

    switch (scheduled.recurrencePattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    // Check if past end date
    if (scheduled.recurrenceEndDate && nextDate > scheduled.recurrenceEndDate) {
      return;
    }

    await ScheduledPost.create({
      creator: scheduled.creator,
      post: scheduled.post._id || scheduled.post,
      scheduledFor: nextDate,
      timezone: scheduled.timezone,
      recurring: true,
      recurrencePattern: scheduled.recurrencePattern,
      recurrenceEndDate: scheduled.recurrenceEndDate,
      notes: scheduled.notes,
    });
  }
}

module.exports = SchedulerWorker;
