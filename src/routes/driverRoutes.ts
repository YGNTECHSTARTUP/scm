
import { Hono } from "hono";
import { db } from "../../drizzle/src";
import { dealer, marketer, sale, warehouse,driver } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyDriverToken } from "../middleware/authmiddleware";
import bcrypt from "bcryptjs";
import {z} from "zod";
// import { driver } from "../db/schema/driver";

const driverRoutes = new Hono();
driverRoutes.get("/:id", verifyDriverToken, async (c) => {
  const paramId = Number(c.req.param("id"));
  const loggedInUser = (c.req as any).user;

  if (loggedInUser.id !== paramId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const [data] = await db
    .select()
    .from(driver)
    .where(eq(driver.id, paramId));

  if (!data) {
    return c.json({ message: "Driver not found" }, 404);
  }

  return c.json({
    id: data.id,
    fullName: data.fullName,
    phoneNumber: data.phoneNumber,
    vehicleType: data.vehicleType,
    vehicleNumber: data.vehicleNumber,
    licenseIdentifier: data.licenseIdentifier,
    status: data.status,
  });
});
driverRoutes.put("/:id", verifyDriverToken, async (c) => {
  const paramId = Number(c.req.param("id"));
  const loggedInUser = (c.req as any).user;
  const body = await c.req.json();

  if (loggedInUser.id !== paramId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const [updated] = await db
    .update(driver)
    .set({
      vehicleType: body.vehicleType,
      vehicleNumber: body.vehicleNumber,
      status: body.status,
    })
    .where(eq(driver.id, paramId))
    .returning();

  if (!updated) {
    return c.json({ message: "Driver not found" }, 404);
  }

  return c.json(updated);
});
driverRoutes.delete("/:id", verifyDriverToken, async (c) => {
  const paramId = Number(c.req.param("id"));
  const loggedInUser = (c.req as any).user;

  if (loggedInUser.id !== paramId) {
    return c.json({ message: "Forbidden" }, 403);
  }

  await db.delete(driver).where(eq(driver.id, paramId));

  return c.json({ message: "Driver deleted successfully" });
});

export default driverRoutes;