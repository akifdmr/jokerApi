// src/core/socket/common-socket.ts
import net from "net";
import { randomUUID } from "crypto";

type Client = {
  id: string;
  socket: net.Socket;
};

let server: net.Server | null = null;
const clients = new Map<string, Client>();

export function startSocket(
  port: number,
  onTrack: (track: string, clientId: string) => void
) {
  if (server) return;

  const createServer = () =>
    net.createServer((socket) => {
      const clientId = randomUUID();

      clients.set(clientId, { id: clientId, socket });
      console.log(`🟢 Client connected: ${clientId}`);

      socket.on("data", (buf) => {
        const track = buf.toString().trim();
        onTrack(track, clientId);
      });

      socket.on("close", () => {
        clients.delete(clientId);
        console.log(`🔴 Client disconnected: ${clientId}`);
      });

      socket.on("error", (err) => {
        clients.delete(clientId);
        console.error(`❌ Client error ${clientId}`, err.message);
      });
    });

  let currentPort = port;
  let retryCount = 0;
  const maxRetries = 10;

  const listen = () => {
    server = createServer();

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && retryCount < maxRetries) {
        const nextPort = currentPort + 1;
        retryCount += 1;
        console.warn(`⚠️ Socket port ${currentPort} in use, trying ${nextPort}...`);
        currentPort = nextPort;

        // Clean up and retry on a new port without killing the whole app.
        server?.close(() => {
          server = null;
          listen();
        });
        return;
      }

      console.error("❌ Socket server error:", err);
      // Do not throw: socket is optional; REST API should keep running.
    });

    server.listen(currentPort, () => {
      console.log(`🧠 Socket server listening on ${currentPort}`);
    });
  };

  listen();
}

export function stopSocket() {
  if (!server) return;

  for (const client of clients.values()) {
    client.socket.destroy();
  }

  clients.clear();

  server.close(() => {
    console.log("🛑 Socket server stopped");
  });

  server = null;
}

/* 🔁 OPSİYONEL (ileride kullanacağız) */
export function broadcast(message: string) {
  for (const client of clients.values()) {
    client.socket.write(message);
  }
}

export function sendToClient(clientId: string, message: string) {
  const client = clients.get(clientId);
  if (client) client.socket.write(message);
}
