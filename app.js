// โหลดค่าจาก .env ก่อนเริ่มแอป
import "dotenv/config";
import express from "express";
import cors from "cors";
import postRouter, { createPost } from "./routes/posts.js";
import { validatePostInput } from "./middlewares/postValidation.js";

const app = express();
const port = process.env.PORT || 4000;

// อนุญาตให้ Frontend จาก origin ที่กำหนดเรียก API ได้
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://kaopan-learning-blog.vercel.app",
    ],
  })
);
// แปลง JSON body จาก request ให้ใช้เป็น req.body ได้
app.use(express.json());

// ข้อมูลจำลองสำหรับ GET /profiles
const data = {
  name: "john",
  age: 20,
};

// เช็คว่า server รันอยู่ (หน้าแรก)
app.get("/", (req, res) => {
  return res.send("🚀 Backend API Server is running successfully!");
});

// Health check สำหรับ Frontend / monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

// โปรไฟล์ตัวอย่าง (mock)
app.get("/profiles", (req, res) => {
  res.status(200).json({ data });
});

// เชื่อม routes ของโพสต์ทั้งหมดไว้ที่ /posts
// เช่น GET /posts, GET /posts/:postId, POST /posts, PUT/DELETE /posts/:postId
app.use("/posts", postRouter);

// สร้างโพสต์แบบเดิมตามโจทย์ API Doc (ชื่อ path เป็น /assignments)
// ทำงานเหมือน POST /posts — ตรวจ body แล้ว INSERT ลงตาราง posts
app.post("/assignments", validatePostInput, createPost);

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
