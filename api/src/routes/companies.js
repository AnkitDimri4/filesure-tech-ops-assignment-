import { Router } from "express";
import { getCompaniesCollection } from "../db.js";

const router = Router();

// GET /companies?status=&state=&page=&limit=
router.get("/", async (req, res) => {
  try {
    const collection = getCompaniesCollection();

    const { status, state, page = 1, limit = 10 } = req.query;
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const filter = {};

    if (status) {
      // Contains match, case-insensitive
      filter.status = { $regex: status, $options: "i" };
    }

    if (state) {
      filter.state = { $regex: state, $options: "i" };
    }

    const skip = (numericPage - 1) * numericLimit;

    const [items, total] = await Promise.all([
      collection.find(filter).skip(skip).limit(numericLimit).toArray(),
      collection.countDocuments(filter),
    ]);

    res.json({
      data: items,
      page: numericPage,
      limit: numericLimit,
      total,
    });
  } catch (err) {
    console.error("GET /companies error:", err.message);
    if (err.message.includes("MongoDB not connected")) {
      return res.status(500).json({ error: "Database not connected" });
    }
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// GET /companies/summary
router.get("/summary", async (req, res) => {
  try {
    const collection = getCompaniesCollection();

    const pipeline = [
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1
        }
      }
    ];

    const summary = await collection.aggregate(pipeline).toArray();
    res.json({ summary });
  } catch (err) {
    console.error("GET /companies/summary error:", err.message);
    if (err.message.includes("MongoDB not connected")) {
      return res.status(500).json({ error: "Database not connected" });
    }
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;