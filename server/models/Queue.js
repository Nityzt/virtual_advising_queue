import mongoose from "mongoose";

const QueueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    maxCapacity: { type: Number, default: 50 },
    averageServiceTime: { type: Number, default: 10 }, // minutes
    openTime: { type: String, default: "09:00" }, // 24-hour format
    closeTime: { type: String, default: "20:00" }, // 24-hour format
    adminEmails: [{ type: String }], // Admins who can manage this queue
    createdBy: { type: String, required: true },
    settings: {
        allowDefer: { type: Boolean, default: true },
        maxDeferTime: { type: Number, default: 60 }, // minutes
        sendSMSNotifications: { type: Boolean, default: false },
        notifyBeforeTime: { type: Number, default: 5 } // minutes before turn
    }
}, {
    timestamps: true
});

// Index for efficient querying
QueueSchema.index({ isActive: 1, createdBy: 1 });

export default mongoose.models.Queue || mongoose.model("Queue", QueueSchema);