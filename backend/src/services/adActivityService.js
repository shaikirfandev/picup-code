const AdActivityLog = require('../models/AdActivityLog');

/**
 * Log an ad-related activity for audit trail / timeline.
 */
async function logActivity({ owner, actionType, entityType, entityId, description, metadata, req }) {
  try {
    await AdActivityLog.create({
      owner,
      actionType,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get?.('user-agent'),
    });
  } catch (err) {
    console.error('AdActivityLog write failed:', err.message);
  }
}

module.exports = { logActivity };
