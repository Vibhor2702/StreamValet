const mongoose = require('mongoose');

const { Schema, Types } = mongoose;

const PROCESSING_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  ANALYZED: 'ANALYZED',
  READY: 'READY',
  FLAGGED: 'FLAGGED',
  FAILED: 'FAILED',
});

const SENSITIVITY_STATUS = Object.freeze({
  SAFE: 'SAFE',
  FLAGGED: 'FLAGGED',
});

const allowedTransitions = {
  [PROCESSING_STATUS.PENDING]: [PROCESSING_STATUS.PROCESSING, PROCESSING_STATUS.FAILED],
  [PROCESSING_STATUS.PROCESSING]: [PROCESSING_STATUS.ANALYZED, PROCESSING_STATUS.FAILED],
  [PROCESSING_STATUS.ANALYZED]: [PROCESSING_STATUS.READY, PROCESSING_STATUS.FLAGGED, PROCESSING_STATUS.FAILED],
  [PROCESSING_STATUS.FLAGGED]: [PROCESSING_STATUS.READY, PROCESSING_STATUS.FAILED],
  [PROCESSING_STATUS.READY]: [],
  [PROCESSING_STATUS.FAILED]: [PROCESSING_STATUS.PROCESSING],
};

const VideoSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      immutable: true,
    },
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    durationSeconds: {
      type: Number,
      min: 0,
    },
    resolution: {
      width: { type: Number, min: 1 },
      height: { type: Number, min: 1 },
    },
    thumbnailPath: {
      type: String,
    },
    processingStatus: {
      type: String,
      enum: Object.values(PROCESSING_STATUS),
      default: PROCESSING_STATUS.PENDING,
      required: true,
    },
    sensitivityStatus: {
      type: String,
      enum: Object.values(SENSITIVITY_STATUS),
    },
    sensitivityConfidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    sensitivityReason: {
      type: String,
    },
    sensitivitySegments: [
      {
        start: { type: Number, min: 0, required: true },
        end: { type: Number, min: 0, required: true },
        reason: { type: String, required: true, trim: true },
      },
    ],
    processingHistory: [
      {
        from: { type: String, enum: Object.values(PROCESSING_STATUS) },
        to: { type: String, enum: Object.values(PROCESSING_STATUS), required: true },
        reason: { type: String },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

VideoSchema.index({ tenantId: 1, owner: 1, createdAt: -1 });

/**
 * Enforce state transitions for the processing pipeline.
 * Allows replay after failure while keeping the sequence strict.
 * @param {string} nextStatus - Target status from PROCESSING_STATUS.
 * @param {string} [reason] - Optional note to persist in the history.
 * @throws {Error} If the transition is invalid.
 */
VideoSchema.methods.transitionTo = function transitionTo(nextStatus, reason) {
  const current = this.processingStatus;
  const allowed = allowedTransitions[current] || [];

  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid transition from ${current} to ${nextStatus}`);
  }

  this.processingHistory.push({ from: current, to: nextStatus, reason });
  this.processingStatus = nextStatus;
};

VideoSchema.statics.PROCESSING_STATUS = PROCESSING_STATUS;
VideoSchema.statics.SENSITIVITY_STATUS = SENSITIVITY_STATUS;
VideoSchema.statics.allowedTransitions = allowedTransitions;

module.exports = mongoose.model('Video', VideoSchema);
