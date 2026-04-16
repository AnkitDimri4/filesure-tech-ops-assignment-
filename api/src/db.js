import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "filesure_assignment";
const collectionName = process.env.MONGO_COLLECTION || "companies";

let client;
let db;
let companiesCollection;

export async function connectDB() {
  if (db) return { db, companiesCollection };

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    companiesCollection = db.collection(collectionName);
    console.log("Connected to MongoDB");
    return { db, companiesCollection };
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

export function getCompaniesCollection() {
  if (!companiesCollection) {
    throw new Error("MongoDB not connected");
  }
  return companiesCollection;
}