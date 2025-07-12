import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// Hardcoded admin credentials (replace with database later)
const ADMIN_CREDENTIALS = {
    email: "admin@yorku.ca",
    password: "$2a$10$mE.qmz/EXAMPLE" // bcrypt hash of "admin123"
};

// Admin login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        // Check credentials
        if (email !== ADMIN_CREDENTIALS.email) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { email, role: "admin" },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            token,
            admin: { email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware to verify admin token
export const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        if (decoded.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export default router;