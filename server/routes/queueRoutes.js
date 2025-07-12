import express from "express";
import QueueEntry from "../models/QueueEntry.js";

export default (io) => {
  const router = express.Router();

  // GET all entries (original route - keep for compatibility)
  router.get("/", async (req, res) => {
    try {
      const entries = await QueueEntry.find().lean();
      const cleanEntries = entries.map(e => ({
        _id: e._id,
        name: e.name,
        studentId: e.studentId,
        email: e.email || 'N/A',
        status: e.status || 'waiting',
        joinedAt: e.joinedAt || e.createdAt
      }));
      res.json(cleanEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST new entry (updated to support new fields)
  router.post("/", async (req, res) => {
    try {
      const { name, studentId, email, phone, questions, queueId } = req.body;

      if (!name || !studentId) {
        return res.status(400).json({ error: "Name and Student ID required" });
      }

      // Create entry with backward compatibility
      const entryData = {
        name,
        studentId,
        email: email || `${studentId}@my.yorku.ca`, // Default email if not provided
        status: 'waiting'
      };

      // Add optional fields if provided
      if (phone) entryData.phone = phone;
      if (questions) entryData.questions = questions;
      if (queueId) entryData.queueId = queueId;

      const newEntry = await QueueEntry.create(entryData);

      const responseObj = {
        _id: newEntry._id,
        name: newEntry.name,
        studentId: newEntry.studentId,
        email: newEntry.email,
        status: newEntry.status
      };

      io.emit("queue-added", responseObj);
      res.status(201).json(responseObj);
    } catch (error) {
      console.error('Error creating entry:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE entry (original route)
  router.delete("/:id", async (req, res) => {
    try {
      const deletedEntry = await QueueEntry.findByIdAndDelete(req.params.id);
      if (!deletedEntry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      io.emit("queue-deleted", req.params.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      console.error('Error deleting entry:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // New routes for StudentStatus component
  // GET student status for a specific queue
  router.get("/queue/:queueId/status", async (req, res) => {
    try {
      const { queueId } = req.params;
      const studentEmail = req.headers['student-email'];

      if (!studentEmail) {
        return res.status(400).json({ error: "Student email required in headers" });
      }

      // Find student in queue
      const studentEntry = await QueueEntry.findOne({
        email: studentEmail,
        queueId: queueId
      });

      if (!studentEntry) {
        return res.status(404).json({ error: "You are not currently in this queue" });
      }

      // Calculate position (simple version for now)
      const allEntries = await QueueEntry.find({
        queueId: queueId,
        status: { $in: ['waiting', 'deferred'] }
      }).sort({ createdAt: 1 });

      const position = allEntries.findIndex(entry =>
          entry.email === studentEmail
      ) + 1;

      const estimatedWaitTime = Math.max(0, (position - 1) * 10); // 10 min per position

      res.json({
        queueId,
        queueName: "Academic Advising",
        description: "Get help with course selection, degree planning, and academic guidance",
        position,
        estimatedWaitTime,
        studentDetails: {
          name: studentEntry.name,
          email: studentEntry.email,
          phone: studentEntry.phone,
          questions: studentEntry.questions
        },
        status: studentEntry.status || 'waiting',
        joinedAt: studentEntry.joinedAt || studentEntry.createdAt
      });
    } catch (error) {
      console.error('Error getting student status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST defer appointment
  router.post("/queue/:queueId/defer", async (req, res) => {
    try {
      const { queueId } = req.params;
      const { studentEmail, deferMinutes } = req.body;

      if (!studentEmail || !deferMinutes) {
        return res.status(400).json({ error: "Student email and defer minutes required" });
      }

      const entry = await QueueEntry.findOne({
        email: studentEmail,
        queueId: queueId
      });

      if (!entry) {
        return res.status(404).json({ error: "Student not found in queue" });
      }

      // Update entry with defer time
      const deferredUntil = new Date(Date.now() + deferMinutes * 60 * 1000);
      entry.status = 'deferred';
      entry.deferredUntil = deferredUntil;
      await entry.save();

      // Emit update
      io.emit("queue-updated", { queueId });

      res.json({
        message: "Appointment deferred successfully",
        deferredUntil: deferredUntil
      });
    } catch (error) {
      console.error('Error deferring appointment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE student leaves queue
  router.delete("/queue/:queueId/leave", async (req, res) => {
    try {
      const { queueId } = req.params;
      const { studentEmail } = req.body;

      if (!studentEmail) {
        return res.status(400).json({ error: "Student email required" });
      }

      const entry = await QueueEntry.findOneAndDelete({
        email: studentEmail,
        queueId: queueId
      });

      if (!entry) {
        return res.status(404).json({ error: "Student not found in queue" });
      }

      // Emit updates
      io.emit("queue-deleted", entry._id);
      io.emit("queue-updated", { queueId });

      res.json({ message: "Successfully left the queue" });
    } catch (error) {
      console.error('Error leaving queue:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST complete advising (admin action)
  router.post("/:id/complete", async (req, res) => {
    try {
      const entry = await QueueEntry.findById(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      // Mark as completed
      entry.status = 'completed';
      entry.completedAt = new Date();
      await entry.save();

      // Emit updates
      io.emit("queue-completed", req.params.id);
      io.emit("queue-updated", { queueId: entry.queueId });

      res.json({ message: "Advising completed successfully" });
    } catch (error) {
      console.error('Error completing entry:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};