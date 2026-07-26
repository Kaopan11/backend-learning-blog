import express from "express";
import pool from "../utils/db.js";
import { validatePostInput } from "../middlewares/postValidation.js";

const postRouter = express.Router();

export async function createPost(req, res) {
  const { title, image, category_id, description, content, status_id } =
    req.body;

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
    console.error("POST /posts error:", error.message);
    return res.status(500).json({
      message: "Server could not create post because database connection",
    });
  }
}

// GET /posts
postRouter.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 6;
  const category = req.query.category;
  const keyword = req.query.keyword;
  const offset = (page - 1) * limit;

  try {
    const values = [];
    const where = [];

    if (category) {
      values.push(category);
      where.push(`categories.name ILIKE $${values.length}`);
    }

    if (keyword) {
      values.push(`%${keyword}%`);
      const i = values.length;
      where.push(
        `(posts.title ILIKE $${i} OR posts.description ILIKE $${i} OR posts.content ILIKE $${i})`
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM posts
       LEFT JOIN categories ON posts.category_id = categories.id
       ${whereSql}`,
      values
    );

    const totalPosts = countResult.rows[0].total;
    const totalPages = Math.ceil(totalPosts / limit) || 0;
    const nextPage = page < totalPages ? page + 1 : null;

    const listValues = [...values, limit, offset];
    const result = await pool.query(
      `SELECT
         posts.id,
         posts.image,
         categories.name AS category,
         posts.title,
         posts.description,
         posts.date,
         posts.content,
         statuses.status AS status,
         posts.likes_count
       FROM posts
       LEFT JOIN categories ON posts.category_id = categories.id
       LEFT JOIN statuses ON posts.status_id = statuses.id
       ${whereSql}
       ORDER BY posts.id ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      listValues
    );

    return res.status(200).json({
      totalPosts,
      totalPages,
      currentPage: page,
      limit,
      posts: result.rows,
      nextPage,
    });
  } catch (error) {
    console.error("GET /posts error:", error.message);
    return res.status(500).json({
      message: "Server could not read post because database connection",
    });
  }
});

// POST /posts
postRouter.post("/", validatePostInput, createPost);

// GET /posts/:postId
postRouter.get("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         posts.id,
         posts.image,
         categories.name AS category,
         posts.title,
         posts.description,
         posts.date,
         posts.content,
         statuses.status AS status,
         posts.likes_count
       FROM posts
       LEFT JOIN categories ON posts.category_id = categories.id
       LEFT JOIN statuses ON posts.status_id = statuses.id
       WHERE posts.id = $1`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("GET /posts/:postId error:", error.message);
    return res.status(500).json({
      message: "Server could not read post because database connection",
    });
  }
});

// PUT /posts/:postId
postRouter.put("/:postId", validatePostInput, async (req, res) => {
  const { postId } = req.params;
  const { title, image, category_id, description, content, status_id } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE posts
       SET title = $2,
           image = $3,
           category_id = $4,
           description = $5,
           content = $6,
           status_id = $7
       WHERE id = $1`,
      [postId, title, image, category_id, description, content, status_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to update",
      });
    }

    return res.status(200).json({
      message: "Updated post sucessfully",
    });
  } catch (error) {
    console.error("PUT /posts/:postId error:", error.message);
    return res.status(500).json({
      message: "Server could not update post because database connection",
    });
  }
});

// DELETE /posts/:postId
postRouter.delete("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(`DELETE FROM posts WHERE id = $1`, [
      postId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to delete",
      });
    }

    return res.status(200).json({
      message: "Deleted post sucessfully",
    });
  } catch (error) {
    console.error("DELETE /posts/:postId error:", error.message);
    return res.status(500).json({
      message: "Server could not delete post because database connection",
    });
  }
});

export default postRouter;
