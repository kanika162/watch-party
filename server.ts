import express from "express";
import http from "http";
import { Server } from "socket.io";
import { corsMiddleware } from "./middleware/corsConfig";
import { errorHandler } from "./middleware/errorHandler";
import { healthHandler } from "./controllers/healthController";
import { createRoomHandler, joinRoomHandler, setRoomManager } from "./controllers/roomController";
import { setupRoomSocket } from "./sockets/roomSocket";
import { initDb } from "./db";
import { log } from "./utils/logger";

const PORT = Number(process.env.PORT || 5000);

const app = express();
app.use(express.json());
app.use(corsMiddleware);

app.get("/api/health", healthHandler);
app.post("/api/rooms", createRoomHandler);
app.post("/api/rooms/:roomId/join", joinRoomHandler);

app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*"
  }
});

setupRoomSocket(io);

server.listen(PORT, () => {
  initDb();
  log(`Server listening on port ${PORT}`);
});
