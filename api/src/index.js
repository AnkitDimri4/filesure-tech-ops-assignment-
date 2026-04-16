import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import companiesRouter from "./routes/companies.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Attach routes
app.use("/companies", companiesRouter);

// Start server after DB connect
async function start() {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`API server listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB error:", err.message);
    process.exit(1);
  }
}

start();