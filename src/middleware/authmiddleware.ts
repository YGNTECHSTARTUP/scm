import { Context, Next } from "hono";
import { db } from "../../drizzle/src/index";
import { dealer, marketer } from "../db/schema";
import { eq } from "drizzle-orm";
import { createToken, verifyToken } from "../utils/jwt";
import { setCookie, getCookie } from "hono/cookie";

const COOKIE_MAX_AGE = 60 * 60; // 1 hour

export async function verifyDealerToken(c: Context, next: Next) {
  try {
  const token = getCookie(c, "dealer_token");
    if (!token) return c.json({ message: "Unauthorized" }, 401);

    const payload = await verifyToken(token);
    const [user] = await db.select().from(dealer).where(eq(dealer.id, Number(payload.userId)));

    if (!user || user.jwttoken !== token)
      return c.json({ message: "Invalid or expired token" }, 403);

    // Refresh token (rolling session)
    const newToken = await createToken({ userId: user.id });
    await db.update(dealer).set({ jwttoken: newToken }).where(eq(dealer.id, user.id));

    setCookie(c, "dealer_token", newToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    (c.req as any).user = user;
    await next();
  } catch (err) {
    console.error(err);
    return c.json({ message: "Unauthorized" }, 401);
  }
}

export async function verifyMarketerToken(c: Context, next: Next) {
  try {
  const token = getCookie(c, "marketer_token");
    if (!token) return c.json({ message: "Unauthorized" }, 401);

    const payload = await verifyToken(token);
    const [user] = await db.select().from(marketer).where(eq(marketer.id, Number(payload.userId)));

    if (!user || user.jwtToken !== token)
      return c.json({ message: "Invalid or expired token" }, 403);

    const newToken = await createToken({ userId: user.id });
    await db.update(marketer).set({ jwtToken: newToken }).where(eq(marketer.id, user.id));

    setCookie(c, "marketer_token", newToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    (c.req as any).user = user;
    await next();
  } catch (err) {
    console.error(err);
    return c.json({ message: "Unauthorized" }, 401);
  }
}
