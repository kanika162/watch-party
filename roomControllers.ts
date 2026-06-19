import { Request, Response } from "express";
import { RoomModel } from "../models/RoomModel";
import { RoomManager } from "../services/RoomManager";

let roomManagerSingleton: RoomManager | null = null;

export const setRoomManager = (manager: RoomManager) => {
  roomManagerSingleton = manager;
};

export const createRoomHandler = async (req: Request, res: Response) => {
  const username = (req.body?.username || "").trim();
  if (!username) {
    return res.status(400).send("Username is required");
  }
  if (!roomManagerSingleton) {
    return res.status(500).send("Server not initialized");
  }
  const fakeHostId = `http-host-${Date.now()}`;
  const roomId = await roomManagerSingleton.createRoom(username, fakeHostId);
  return res.json({ roomId });
};

export const joinRoomHandler = async (req: Request, res: Response) => {
  const username = (req.body?.username || "").trim();
  const roomId = (req.params.roomId || "").trim().toUpperCase();
  if (!username) return res.status(400).send("Username is required");
  if (!roomId) return res.status(400).send("Room ID is required");

  const room = await RoomModel.findById(roomId);
  if (!room) {
    return res.status(404).send("Room not found");
  }
  return res.json({ roomId });
};
