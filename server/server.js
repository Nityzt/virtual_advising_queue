import express from "express";
import mongoose from "mongoose";
mongoose.models = {};
mongoose.modelSchemas = {};
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import queueRoutes from "./routes/queueRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
        allowedHeaders: ["Content-Type", "student-email", "admin-token"],
        credentials: true
    },
});

// Enhanced CORS middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, student-email, admin-token, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Socket.io connection handling
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle student joining a queue room
    socket.on("join-queue", (queueId) => {
        socket.join(`queue-${queueId}`);
        console.log(`Socket ${socket.id} joined queue-${queueId}`);
    });

    // Handle admin joining admin room
    socket.on("join-admin", () => {
        socket.join("admin");
        console.log(`Socket ${socket.id} joined admin room`);
    });

    // Handle leaving queue room
    socket.on("leave-queue", (queueId) => {
        socket.leave(`queue-${queueId}`);
        console.log(`Socket ${socket.id} left queue-${queueId}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Make io available to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Mount routes
app.use("/api/queue", queueRoutes(io));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Something went wrong!",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
        const PORT = process.env.PORT || 5001;
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Socket.IO server ready`);
        });
    })
    .catch((err) => console.error("MongoDB connection error:", err));

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT. Graceful shutdown...');
    httpServer.close(() => {
        mongoose.connection.close(() => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
});

export default app;