import { Hono } from "hono";
import dealerAuth from "./routes/dealerAuth";
import documentRoute from "./routes/documentUpload";


import marketerAuth from "./routes/marketerAuth";
import { verifyDealerToken, verifyMarketerToken } from "./middleware/authmiddleware";
import dealerCrud from "./routes/dealerCrud";
import markerterCrud from "./routes/marketerCrud";
import warehouseCrud from "./routes/warehouseCrud";
import salesCrud from "./routes/salesCrud";
import driverAuth from "./routes/driverAuth";
import driverRoutes from "./routes/driverRoutes";
const app = new Hono();

// Public routes
app.route("/api/dealer", dealerAuth);
app.route("/api/marketer", marketerAuth);

//protected routes
app.route("/api/dealers",dealerCrud);
app.route('/api/marketers',markerterCrud);
app.route('/api/warehouses',warehouseCrud);
app.route('/api/sales',salesCrud)
app.route('/api/documents',documentRoute);
app.route('/api/driverAuth',driverAuth);
app.route('/api/driverRoutes',driverRoutes);

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
