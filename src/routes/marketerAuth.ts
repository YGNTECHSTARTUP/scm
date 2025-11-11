import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { db } from "../../drizzle/src/index";
import { marketer } from "../db/schema";
import { eq } from "drizzle-orm";
import { createToken } from "../utils/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";

const marketerAuth = new Hono();

marketerAuth.post("/register", async (c) => {
  const { dealerId, name, contact, password } = await c.req.json();
  const hashed = await bcrypt.hash(password, 10);

  await db.insert(marketer).values({ dealerId, name, contact,passWord:hashed, jwtToken: null });
  return c.json({ message: "Marketer registered successfully" });
});

marketerAuth.post("/login", async (c) => {
  try {
    // 🔹 Step 1: Get login credentials
    const { name, password } = await c.req.json();
    if (!name || !password) {
      return c.json({ message: "Name and password are required" }, 400);
    }

    // 🔹 Step 2: Find marketer by name
    const [user] = await db.select().from(marketer).where(eq(marketer.name, name));
    if (!user) return c.json({ message: "Marketer not found" }, 404);

    // 🔹 Step 3: Check hashed password
    if (typeof user.passWord !== "string" || user.passWord === null) {
      // stored hash missing or null — treat as invalid credentials
      return c.json({ message: "Invalid credentials" }, 401);
    }
    const isValid = await bcrypt.compare(password, user.passWord);
    if (!isValid) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    // 🔹 Step 4: Create JWT token
    const token = await createToken({ userId: user.id });

    // 🔹 Step 5: Save token in DB
    await db.update(marketer).set({ jwtToken: token }).where(eq(marketer.id, user.id));

    // 🔹 Step 6: Set HttpOnly cookie
    setCookie(c, "marketer_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 3600, // 1 hour
    });

    // 🔹 Step 7: Respond success
    return c.json({
      message: "Marketer logged in successfully",
      marketer: {
        id: user.id,
        name: user.name,
        contact: user.contact,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return c.json({ message: "Server error" }, 500);
  }
});

marketerAuth.post("/logout", async (c) => {
  const token = getCookie(c, "marketer_token");
  if (!token) return c.json({ message: "No session" });

  deleteCookie(c, "marketer_token", { maxAge: 0, path: "/" });
  return c.json({ message: "Marketer logged out" });
});

export default marketerAuth;
