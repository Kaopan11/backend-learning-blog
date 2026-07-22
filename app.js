import express from "express";

const app = express();
const PORT = 4000;

// 1. Database Mockup
const data = 
    {
        "name": "john",
        "age": 20
    };

// 2. สร้าง API Endpoints
// GET /profiles
app.get("/profiles", (req, res) => {
  res.status(200).json({ data: data });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
