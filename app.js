import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
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

// GET /profiles
app.get("/profiles", (req, res) => {
  res.status(200).json({ data });
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
