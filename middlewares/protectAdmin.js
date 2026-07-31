import connectionPool from "../utils/db.js";
import supabase from "../utils/supabase.js";

export async function protectAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: "Unauthorized or token expired",
      });
    }

    const result = await connectionPool.query(
      "SELECT role FROM users WHERE id = $1",
      [data.user.id]
    );

    if (result.rows.length === 0 || result.rows[0].role !== "admin") {
      return res.status(403).json({
        error: "Forbidden: You do not have admin access",
      });
    }

    req.user = { ...data.user };
    next();
  } catch (error) {
    console.error("protectAdmin error:", error.message);
    return res.status(500).json({ error: "Authorization failed" });
  }
}
