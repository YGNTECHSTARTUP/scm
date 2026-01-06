// routes/driver.ts
import { Hono } from "hono";
import { db } from "../../drizzle/src/index";
import { driver } from "../db/schema";
import { eq } from "drizzle-orm";
// import bcrypt from "bcrypt";
import bcrypt from "bcryptjs";
import { createToken} from "../utils/jwt";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
// import {verify}

// import { Context } from "hono/jsx";
// const COOKIE_MAX_AGE
const driverAuth = new Hono();
driverAuth.post("/register", async (c) => {
  const {
    fullName,
    phoneNumber,
    vehicleType,
    vehicleNumber,
    licenseIdentifier,
    password,
  } = await c.req.json();

  const hashed = await bcrypt.hash(password, 10);

  await db.insert(driver).values({
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
      },
    });
  } catch (err) {
    console.error("Driver login error:", err);
    return c.json({ message: "Server error" }, 500);
  }
});

// import { deleteCookie, getCookie } from "hono/cookie";

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

// driverAuth.get(
//   "/warehouses",
//   verifyDriverToken,
//   async (c) => {
//     const driver = (c.req as any).user;
//     return c.json({ driverId: driver.id });
//   }
// );
export default driverAuth;