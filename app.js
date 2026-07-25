import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./utils/db.js";


const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://kaopan-learning-blog.vercel.app",
    ],
  })
);
app.use(express.json());

// 1. Database Mockup
const data = {
  name: "john",
  age: 20,
};

// 2. สร้าง API Endpoints

// Test Status Server
app.get('/', (req, res) => {
  return res.send('🚀 Backend API Server is running successfully!');
});

// GET /health
app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

// GET /profiles
app.get("/profiles", (req, res) => {
  res.status(200).json({ data });
});

// POST /assignments — สร้างบทความใหม่ในตาราง posts
app.post("/assignments", async (req, res) => {
  const { title, image, category_id, description, content, status_id } =
    req.body;

  if (
    !title ||
    !image ||
    !category_id ||
    !description ||
    !content ||
    !status_id
  ) {
    return res.status(400).json({
      message:
        "Server could not create post because there are missing data from client",
    });
  }

  try {
    await pool.query(
      `INSERT INTO posts (title, image, category_id, description, content, status_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, image, category_id, description, content, status_id]
    );

    return res.status(201).json({
      message: "Created post sucessfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not create post because database connection",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
