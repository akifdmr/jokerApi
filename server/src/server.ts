import "dotenv/config";
import app from "./app.js";

import Swipe from "./core/db/models/Swipe.model.js";
import { initDatabase, connectDB } from "./core/db/init/index.js";
import { startSocket, stopSocket } from "./core/socket/common-socket.js";
import { parseTrack, maskPan } from "./devices/trackParser.js";
import { setLiveSwipe } from "./devices/liveSwipeStore.js";
import { setupSwagger } from "./swagger.js";

const PORT = Number(process.env.PORT) || 1453;
const SOCKET_PORT = Number(process.env.SOCKET_PORT) || 5555;

let server: ReturnType<typeof app.listen> | null = null;

const startServer = async () => {
  try {
    /* ================================
       DATABASE (ONLY ONCE)
    ================================= */
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();

    console.log("🧱 Initializing database...");
    await initDatabase();

    /* ================================
       SWAGGER (BEFORE ROUTES)
    ================================= */
    setupSwagger(app);

    /* ================================
       SOCKET SERVER (MULTI CLIENT)
    ================================= */
    startSocket(SOCKET_PORT, async (track: string, clientId: string) => {
      try {
        console.log(`📡 TRACK FROM ${clientId}:`, track);

        /* ---------- PARSE ---------- */
        const parsed = parseTrack(track);
        if (!parsed || !parsed.pan) {
          console.warn(`⚠️ Invalid track from ${clientId}`);
          return;
        }

        const panMasked = maskPan(parsed.pan);

        /* ---------- DB SAVE ---------- */
        const swipe = await Swipe.create({
          panMasked,
          exp: parsed.exp,
          trackType: parsed.trackType,
          raw: track,
          source: "windows",
          clientId,
        });

        console.log(`🧱 Swipe saved (${clientId}):`, swipe.id);

        /* ---------- LIVE DATA (SWAGGER) ---------- */
        setLiveSwipe({
          clientId,
          panMasked,
          exp: parsed.exp,
          trackType: parsed.trackType,
          at: new Date(),
        });

        /* ---------- PROVIDER FLOW (OPTIONAL) ---------- */
        // await routeToProvider({
        //   ...parsed,
        //   clientId,
        // });

      } catch (err) {
        console.error(`❌ Socket processing error (${clientId}):`, err);
      }
    });

    /* ================================
       REST API
    ================================= */
    server = app.listen(PORT, () => {
      console.log(`🔥 API server running on port ${PORT}`);
      console.log(`📘 Swagger → http://localhost:${PORT}/docs`);
    });

    /* ================================
       GRACEFUL SHUTDOWN
    ================================= */
    const shutdown = () => {
      console.log("🛑 Graceful shutdown started...");
      stopSocket();

      if (server) {
        server.close(() => {
          console.log("✅ HTTP server closed");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("❌ Server startup failed", error);
    process.exit(1);
  }
};

startServer();
