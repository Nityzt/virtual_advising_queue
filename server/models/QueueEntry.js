import mongoose from "mongoose";

const QueueEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  questions: { type: String },
  queueId: {
    type: String,
    required: true,  // ✅ MAKE IT REQUIRED
    default: 'general-advising'  // ✅ Keep a safe default for now
  },
  status: {
    type: String,
    enum: ['waiting', 'deferred', 'notified', 'completed', 'no-show'],
    default: 'waiting'
  },
  deferredUntil: { type: Date },
  joinedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, {
  timestamps: true
});

QueueEntrySchema.index({ queueId: 1, status: 1, createdAt: 1 });
QueueEntrySchema.index({ email: 1, queueId: 1 });

export default mongoose.models.QueueEntry || mongoose.model("QueueEntry", QueueEntrySchema);