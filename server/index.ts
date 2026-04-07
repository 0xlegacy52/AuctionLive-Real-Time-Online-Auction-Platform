import express from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./db.js";
import { setupSocket } from "./socket.js";
import { initScheduler } from "./scheduler.js";
import authRoutes from "./routes/auth.js";
import auctionRoutes from "./routes/auctions.js";
import bidRoutes from "./routes/bids.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

setupSocket(httpServer);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const PgStore = ConnectPgSimple(session);

app.use(
  session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "auctionlive-dev-secret-" + (process.env.REPL_ID || "local"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);

const distPath = path.resolve(__dirname, "../dist/public");
const clientPath = path.resolve(__dirname, "../client");

app.use(express.static(distPath));

app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.sendFile(path.join(clientPath, "index.html"), (err2) => {
        if (err2) {
          res.status(200).send(`
            <!DOCTYPE html>
            <html><head><title>AuctionLive</title></head>
            <body>
              <div id="root"></div>
              <script>
                window.location.href = window.location.protocol + '//' + window.location.hostname + ':5173';
              </script>
            </body></html>
          `);
        }
      });
    }
  });
});

const PORT = parseInt(process.env.PORT || "5000");

httpServer.listen(PORT, "0.0.0.0", async () => {
  console.log(`AuctionLive server running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log("Database connected");
    await initScheduler();
  } catch (error) {
    console.error("Failed to connect to database:", error);
  }
});
