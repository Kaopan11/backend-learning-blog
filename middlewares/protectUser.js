import supabase from "../utils/supabase.js";

export async function protectUser(req, res, next) {
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

    req.user = { ...data.user };
    next();
  } catch (error) {
    console.error("protectUser error:", error.message);
    return res.status(401).json({ error: "Unauthorized or token expired" });
  }
}
