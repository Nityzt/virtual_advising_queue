import mongoose from "mongoose";

const QueueEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  // New fields with defaults for backward compatibility
  email: { type: String, default: function() { return `${this.studentId}@my.yorku.ca`; } },
  phone: { type: String },
  questions: { type: String },
  queueId: { type: String, default: 'default-queue' },
  status: {
    type: String,
    enum: ['waiting', 'deferred', 'notified', 'completed'],
    default: 'waiting'
  },
  deferredUntil: { type: Date },
  joinedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Index for efficient querying
QueueEntrySchema.index({ queueId: 1, status: 1, createdAt: 1 });
QueueEntrySchema.index({ email: 1, queueId: 1 });

export default mongoose.models.QueueEntry || mongoose.model("QueueEntry", QueueEntrySchema);