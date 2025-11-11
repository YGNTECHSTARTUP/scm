import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { db } from "../../drizzle/src/index";
import { dealer } from "../db/schema";
import { eq } from "drizzle-orm";
import { createToken } from "../utils/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";

const dealerAuth = new Hono();

// Register dealer
dealerAuth.post("/register", async (c) => {
  const { name, contact, password } = await c.req.json();
  const hashed = await bcrypt.hash(password, 10);

  await db.insert(dealer).values({
    name,
    contact,
    passWord: hashed,
    jwttoken: null,
  });
  return c.json({ message: "Dealer registered successfully" });
});

// Login dealer
dealerAuth.post("/login", async (c) => {
  try {
    // 🔹 Step 1: Parse credentials
    const { name, password } = await c.req.json();

    if (!name || !password) {
      return c.json({ message: "Name and password are required" }, 400);
    }

    // 🔹 Step 2: Find dealer by name
    const [user] = await db.select().from(dealer).where(eq(dealer.name, name));
    if (!user) return c.json({ message: "Dealer not found" }, 404);

    // 🔹 Step 3: Verify password hash
    console.log(typeof user.passWord,typeof password)
    // Assuming you stored the hashed password in `user.password`
    if (typeof user.passWord !== "string" || user.passWord === null) {
      // stored hash missing or null — treat as invalid credentials
      return c.json({ message: "Invalid credentials" }, 401);
    }
    const isValid = await bcrypt.compare(password, user.passWord);

    if (!isValid) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    // 🔹 Step 4: Generate JWT token
    const token = await createToken({ userId: user.id });

    // 🔹 Step 5: Save token in DB
    await db.update(dealer).set({ jwttoken: token }).where(eq(dealer.id, user.id));

    // 🔹 Step 6: Set cookie
    setCookie(c, "dealer_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 3600, // 1 hour
    });

    // 🔹 Step 7: Return response
    return c.json({
      message: "Dealer logged in successfully",
      dealer: { id: user.id, name: user.name, contact: user.contact },
    });
  } catch (err) {
    console.error("Login error:", err);
    return c.json({ message: "Server error" }, 500);
  }
});

// Logout dealer
dealerAuth.post("/logout", async (c) => {
  const token = getCookie(c, "dealer_token");
  if (!token) return c.json({ message: "No session" });

  deleteCookie(c, "dealer_token", { maxAge: 0, path: "/" });
  return c.json({ message: "Dealer logged out" });
});

export default dealerAuth;
