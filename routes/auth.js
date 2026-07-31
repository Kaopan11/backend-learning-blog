import express from "express";
import connectionPool from "../utils/db.js";
import supabase from "../utils/supabase.js";

const authRouter = express.Router();

// POST /auth/register
authRouter.post("/register", async (req, res) => {
  const { email, password, username, name } = req.body;

  try {
    const existingUser = await connectionPool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "This username is already taken" });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (
        error.code === "user_already_exists" ||
        error.message?.includes("user_already_exists")
      ) {
        return res.status(400).json({
          error: "User with this email already exists",
        });
      }
      throw error;
    }

    const result = await connectionPool.query(
      `INSERT INTO users (id, username, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.user.id, username, name, "user"]
    );

    return res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("POST /auth/register error:", error.message);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// POST /auth/login
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (
        error.code === "invalid_credentials" ||
        error.message?.includes("Invalid login credentials")
      ) {
        return res.status(400).json({
          error: "Your password is incorrect or this email doesn't exist",
        });
      }
      throw error;
    }

    return res.status(200).json({
      message: "Signed in successfully",
      access_token: data.session.access_token,
    });
  } catch (error) {
    console.error("POST /auth/login error:", error.message);
    return res.status(500).json({ error: "Login failed" });
  }
});

// GET /auth/get-user
authRouter.get("/get-user", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      return res.status(401).json({
        error: "Unauthorized or token expired",
      });
    }

    const result = await connectionPool.query(
      "SELECT id, username, name, role, profile_pic FROM users WHERE id = $1",
      [authData.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    return res.status(200).json({
      id: user.id,
      email: authData.user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      profilePic: user.profile_pic,
    });
  } catch (error) {
    console.error("GET /auth/get-user error:", error.message);
    return res.status(500).json({ error: "Failed to get user profile" });
  }
});

// PUT /auth/reset-password
authRouter.put("/reset-password", async (req, res) => {
  const authHeader = req.headers.authorization;
  const { oldPassword, newPassword } = req.body;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return res.status(401).json({
        error: "Unauthorized or token expired",
      });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: oldPassword,
    });

    if (signInError) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("PUT /auth/reset-password error:", error.message);
    return res.status(500).json({ error: "Failed to update password" });
  }
});

export default authRouter;
