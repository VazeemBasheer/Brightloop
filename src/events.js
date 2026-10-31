// src/events.js - Live Audit Trail & Event Bus for Dev 1 Live Activity Feed
const { db, saveDatabase } = require('./db');

/**
 * Ensures the events array exists in the database
 */
function ensureEventsArray() {
  if (!db.events) {
    db.events = [
      {
        id: "EVT-001",
        type: "system.init",
        action: "DATABASE_INITIALIZED",
        details: "Brightloop core engine initialized with seed catalog.",
        timestamp: new Date().toISOString()
      }
    ];
  }
}

/**
 * Logs a new audit event
 * @param {string} type - e.g. 'billing.run', 'invoice.paid', 'time.advanced', 'seat.adjusted'
 * @param {string} action - Short uppercase action code
 * @param {string|object} details - Human-readable or structured details
 */
function recordEvent(type, action, details) {
  ensureEventsArray();

  const event = {
    id: `EVT-${(db.events.length + 1).toString().padStart(4, '0')}`,
    type: type,
    action: action,
    details: details,
    timestamp: new Date().toISOString()
  };

  db.events.unshift(event); // Newest first

  // Keep last 100 events to prevent memory bloat
  if (db.events.length > 100) {
    db.events = db.events.slice(0, 100);
  }

  saveDatabase();
  return event;
}

/**
 * Returns recent events
 * @param {number} limit 
 */
function getEvents(limit = 20) {
  ensureEventsArray();
  return db.events.slice(0, limit);
}

module.exports = {
  recordEvent,
  getEvents
};

