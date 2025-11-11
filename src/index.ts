import { Hono } from "hono";
import dealerAuth from "./routes/dealerAuth";

import { getCookie, setCookie, deleteCookie } from "hono/cookie";

import marketerAuth from "./routes/marketerAuth";
import { verifyDealerToken, verifyMarketerToken } from "./middleware/authmiddleware";

const app = new Hono();

// Public routes
app.route("/api/dealer", dealerAuth);
app.route("/api/marketer", marketerAuth);

// Protected examples
app.get("/api/dealer/profile", verifyDealerToken, (c) => {
  const user = (c.req as any).user;
  return c.json({ message: "Dealer Profile", user });
});

app.get("/api/marketer/profile", verifyMarketerToken, (c) => {
  const user = (c.req as any).user;
  return c.json({ message: "Marketer Profile", user });
});

export default app; // ✅ Important for Cloudflare Workers
