// routes/driver.ts
import { Hono } from "hono";
import { db } from "../../drizzle/src/index";
import { driver, marketer, warehouse } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken } from "../utils/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { verifyDriverToken } from "../middleware/authmiddleware";

const driverAuth = new Hono();
driverAuth.post("/register", async (c) => {
  const {
    marketerId,
    fullName,
    phoneNumber,
    vehicleType,
    vehicleNumber,
    licenseIdentifier,
    password,
  } = await c.req.json();

  if (!marketerId) {
    return c.json({ message: "marketerId is required" }, 400);
  }

  const hashed = await bcrypt.hash(password, 10);

  await db.insert(driver).values({
    marketerId, // ✅ NEW
    fullName,
    phoneNumber,
    vehicleType,
    vehicleNumber,
    licenseIdentifier,
    password: hashed,
    jwtToken: null,
  });

  return c.json({ message: "Driver registered successfully" }, 201);
});
driverAuth.post("/login", async (c) => {
  try {
    const { phoneNumber, password } = await c.req.json();

    if (!phoneNumber || !password) {
      return c.json({ message: "Phone number and password required" }, 400);
    }

    const [user] = await db
      .select()
      .from(driver)
      .where(eq(driver.phoneNumber, phoneNumber));

    if (!user || typeof user.password !== "string") {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const token = await createToken({ userId: user.id });

    await db
      .update(driver)
      .set({ jwtToken: token })
      .where(eq(driver.id, user.id));

    setCookie(c, "driver_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 3600,
    });

    return c.json({
      message: "Driver logged in successfully",
      driver: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        marketerId: user.marketerId, // ✅ useful on frontend
      },
    });
  } catch (err) {
    console.error("Driver login error:", err);
    return c.json({ message: "Server error" }, 500);
  }
});
driverAuth.post("/logout", async (c) => {
  const token = getCookie(c, "driver_token");
  if (!token) return c.json({ message: "No active session" });

  await db
    .update(driver)
    .set({ jwtToken: null })
    .where(eq(driver.jwtToken, token));

  deleteCookie(c, "driver_token", { path: "/" });

  return c.json({ message: "Driver logged out successfully" });
});
driverAuth.get(
  "/:id/warehouses",
  verifyDriverToken,
  async (c) => {
    const driverId = Number(c.req.param("id"));
    const loggedIn = (c.req as any).user;

    // 🔒 Security check
    if (loggedIn.id !== driverId) {
      return c.json({ message: "Forbidden" }, 403);
    }

    const result = await db
      .select({
        id: warehouse.id,
        address: warehouse.address,
        geoPoint: warehouse.geoPoint,
        ownerName: warehouse.ownerName,
        contact: warehouse.contact,
        quantity: warehouse.quantity,
      })
      .from(driver)
      .innerJoin(marketer, eq(driver.marketerId, marketer.id))
      .innerJoin(warehouse, eq(marketer.id, warehouse.marketerId))
      .where(eq(driver.id, driverId));

    return c.json(result);
  }
);
export default driverAuth;