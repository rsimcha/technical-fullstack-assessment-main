// MongoDB initialization script for DoorLoop Assessment
// This script runs when the MongoDB container starts for the first time

// Switch to the assessment database
db = db.getSiblingDB('doorloop_assessment');

// Create collections
db.createCollection('users');
db.createCollection('properties');
db.createCollection('auditlogs');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.properties.createIndex({ name: 1 });
db.properties.createIndex({ owner: 1 });
db.auditlogs.createIndex({ timestamp: -1 });
db.auditlogs.createIndex({ entityType: 1, entityId: 1 });

print('Database initialized successfully for DoorLoop Assessment');
