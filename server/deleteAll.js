import mongoose from "mongoose";
import dotenv from "dotenv";
import QueueEntry from "./models/QueueEntry.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await QueueEntry.deleteMany({});
    console.log("All entries deleted.");
    process.exit();
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
