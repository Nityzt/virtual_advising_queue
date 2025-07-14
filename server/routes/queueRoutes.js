// SERVER: Update queueRoutes.js - Add the missing route and fix the status endpoint

import express from "express";
import QueueEntry from "../models/QueueEntry.js";

export default (io) => {
  const router = express.Router();

// GET all entries from today (for CSV export)
  router.get("/all", async (req, res) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);

      const entries = await QueueEntry.find({
        joinedAt: { $gte: startOfDay }
      }).sort({ joinedAt: 1 }).lean();

      res.json(entries);
    } catch (error) {
      console.error("Error fetching all entries:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET active entries only
  router.get("/", async (req, res) => {
    try {
      const entries = await QueueEntry.find({
        status: { $in: ["waiting", "deferred"] }
      }).lean();

      const cleanEntries = entries.map(e => ({
        _id: e._id,
        name: e.name,
        studentId: e.studentId,
        email: e.email || "N/A",
        status: e.status || "waiting",
        joinedAt: e.joinedAt || e.createdAt
      }));

      res.json(cleanEntries);
    } catch (error) {
      console.error("Error fetching entries:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST new entry (updated to support new fields)
  router.post("/", async (req, res) => {
    try {
      console.log('🔍 ===== QUEUE CREATION DEBUG =====');
      console.log('🔍 Full request body:', JSON.stringify(req.body, null, 2));

      const { name, studentId, email, phone, questions, queueId } = req.body;

      console.log('🔍 Extracted queueId:', queueId);
      console.log('🔍 queueId type:', typeof queueId);

      if (!name || !studentId) {
        return res.status(400).json({ error: "Name and Student ID required" });
      }

      // ✅ CRITICAL FIX: Always ensure queueId is set
      const finalQueueId = queueId || 'general-advising';
      console.log('🔍 Final queueId to save:', finalQueueId);

      // Handle email default in application logic
      const finalEmail = email || `${studentId}@my.yorku.ca`;

      // ✅ ALWAYS include queueId in the base object
      const entryData = {
        name,
        studentId,
        email: finalEmail,
        queueId: finalQueueId,  // ✅ ALWAYS SET THIS
        status: 'waiting'
      };

      // Add optional fields if provided
      if (phone) {
        console.log('✅ Adding phone:', phone);
        entryData.phone = phone;
      }
      if (questions) {
        console.log('✅ Adding questions:', questions);
        entryData.questions = questions;
      }

      console.log('🔍 Final entryData to save:', JSON.stringify(entryData, null, 2));

      const newEntry = await QueueEntry.create(entryData);

      console.log('🔍 Saved entry from database:', JSON.stringify(newEntry.toObject(), null, 2));
      console.log('🔍 ================================');

      const responseObj = {
        _id: newEntry._id,
        name: newEntry.name,
        studentId: newEntry.studentId,
        email: newEntry.email,
        status: newEntry.status,
        queueId: newEntry.queueId  // ✅ Include in response
      };

      io.emit("queue-added", responseObj);
      res.status(201).json(responseObj);
    } catch (error) {
      console.error('❌ Error creating entry:', error);
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

  // FIXED: GET student status for a specific queue (this was the missing endpoint!)
  router.get("/:queueId/status", async (req, res) => {
    try {
      const { queueId } = req.params;
      const studentEmail = req.headers['student-email'];

      console.log(`📋 Queue status request - Queue: ${queueId}, Student: ${studentEmail}`);

      if (!studentEmail) {
        return res.status(400).json({ error: "Student email required in headers" });
      }

      // Find student in queue
      const studentEntry = await QueueEntry.findOne({
        email: studentEmail,
        queueId: queueId,
        status: { $in: ['waiting', 'deferred'] } // Only active entries
      });

      if (!studentEntry) {
        return res.status(404).json({ error: "You are not currently in this queue" });
      }

      // Calculate position (get all active entries for this queue, sorted by creation time)
      const allEntries = await QueueEntry.find({
        queueId: queueId,
        status: { $in: ['waiting', 'deferred'] }
      }).sort({ createdAt: 1 });

      const position = allEntries.findIndex(entry =>
          entry.email === studentEmail
      ) + 1;

      const estimatedWaitTime = Math.max(0, (position - 1) * 10); // 10 min per position

      // Queue information based on queueId
      const queueInfo = {
        'academic-advising': {
          name: 'Academic Advising',
          description: 'Get help with course selection, degree planning, and academic requirements.'
        },
        'career-services': {
          name: 'Career Services',
          description: 'Resume review, job search assistance, and career planning.'
        },
        'financial-aid': {
          name: 'Financial Aid',
          description: 'Questions about scholarships, loans, and financial assistance.'
        },
        'general-advising': {
          name: 'General Academic Advising',
          description: 'Get help with course selection, degree planning, and academic requirements.'
        }
      };

      const currentQueueInfo = queueInfo[queueId] || {
        name: 'Academic Queue',
        description: 'Academic advising and support services.'
      };

      console.log(`✅ Student found - Position: ${position}, Wait time: ${estimatedWaitTime} min`);

      res.json({
        queueId,
        queueName: currentQueueInfo.name,
        description: currentQueueInfo.description,
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
  router.post("/:queueId/defer", async (req, res) => {
    try {
      const { queueId } = req.params;
      const { studentEmail, deferMinutes } = req.body;

      console.log('🔍 DEFER DEBUG - queueId from params:', queueId);
      console.log('🔍 DEFER DEBUG - studentEmail:', studentEmail);

      if (!studentEmail || !deferMinutes) {
        return res.status(400).json({ error: "Student email and defer minutes required" });
      }

      const entry = await QueueEntry.findOne({
        email: studentEmail,
        queueId: queueId  // ✅ Make sure we're finding in the correct queue
      });

      if (!entry) {
        return res.status(404).json({ error: "Student not found in queue" });
      }

      console.log('🔍 DEFER DEBUG - Found entry queueId:', entry.queueId);

      // Update entry with defer time
      const deferredUntil = new Date(Date.now() + deferMinutes * 60 * 1000);
      entry.status = 'deferred';
      entry.deferredUntil = deferredUntil;
      // ✅ CRITICAL: Make sure queueId doesn't get lost
      entry.queueId = queueId;

      const savedEntry = await entry.save();
      console.log('🔍 DEFER DEBUG - Saved entry queueId:', savedEntry.queueId);

      // ✅ Get updated queue entries for ALL queues (not just this one)
      const allEntries = await QueueEntry.find({
        status: { $in: ['waiting', 'deferred'] }
      }).sort({ createdAt: 1 }).lean();

      console.log('🔍 DEFER DEBUG - All entries after defer:', allEntries.map(e => ({
        name: e.name,
        queueId: e.queueId,
        status: e.status
      })));

      // ✅ Emit a general refresh signal instead of specific queue data
      io.emit("queue-refresh", {
        message: "Queue updated due to deferral"
      });

      res.json({
        message: "Appointment deferred successfully",
        deferredUntil: deferredUntil
      });
    } catch (error) {
      console.error('❌ Error deferring appointment:', error);
      res.status(500).json({ error: error.message });
    }
  });
  // DELETE student leaves queue
  router.delete("/:queueId/leave", async (req, res) => {
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

      console.log('🔍 COMPLETE DEBUG - Entry queueId before:', entry.queueId);

      // Mark as completed
      entry.status = 'completed';
      entry.completedAt = new Date();
      const savedEntry = await entry.save();

      console.log('🔍 COMPLETE DEBUG - Entry queueId after:', savedEntry.queueId);

      // ✅ Use refresh signal instead of complex queue-updated
      io.emit("queue-refresh", {
        message: "Entry completed"
      });

      res.json({ message: "Advising completed successfully" });
    } catch (error) {
      console.error('Error completing entry:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST mark as no-show (admin action)
  router.post("/:id/noshow", async (req, res) => {
    try {
      const entry = await QueueEntry.findById(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      console.log('🔍 NO-SHOW DEBUG - Entry queueId before:', entry.queueId);

      // Mark as no-show
      entry.status = "no-show";
      const savedEntry = await entry.save();

      console.log('🔍 NO-SHOW DEBUG - Entry queueId after:', savedEntry.queueId);

      // ✅ Use refresh signal
      io.emit("queue-refresh", {
        message: "Entry marked as no-show"
      });

      res.json({ message: "Marked as no-show successfully" });
    } catch (error) {
      console.error("Error marking no-show:", error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/debug", async (req, res) => {
    try {
      // Get ALL entries including completed ones
      const allEntries = await QueueEntry.find({}).lean();

      console.log('🔍 ===== DATABASE DEBUG =====');
      console.log('🔍 Total entries in database:', allEntries.length);

      allEntries.forEach((entry, index) => {
        console.log(`🔍 Entry ${index + 1}:`, {
          id: entry._id,
          name: entry.name,
          studentId: entry.studentId,
          queueId: entry.queueId,
          status: entry.status,
          createdAt: entry.createdAt
        });
      });

      // Group by queueId
      const grouped = {};
      allEntries.forEach(entry => {
        const qId = entry.queueId || 'NO_QUEUE_ID';
        if (!grouped[qId]) grouped[qId] = [];
        grouped[qId].push(entry);
      });

      console.log('🔍 Grouped by queueId:', Object.keys(grouped));
      Object.entries(grouped).forEach(([queueId, entries]) => {
        console.log(`  - ${queueId}: ${entries.length} entries`);
      });
      console.log('🔍 ===========================');

      res.json({
        total: allEntries.length,
        entries: allEntries,
        groupedCount: Object.keys(grouped).map(qId => ({
          queueId: qId,
          count: grouped[qId].length
        }))
      });
    } catch (error) {
      console.error('❌ Debug error:', error);
      res.status(500).json({ error: error.message });
    }
  });


  return router;
};