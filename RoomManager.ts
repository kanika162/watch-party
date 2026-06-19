import { Server, Socket } from "socket.io";
import { RoomModel } from "../models/RoomModel";
import { ParticipantModel, Role } from "../models/ParticipantModel";
import { MessageModel } from "../models/MessageModel";
import { Participant } from "./Participant";
import { extractYouTubeId } from "../utils/youtube";
import { log, logError } from "../utils/logger";

export interface RoomState {
  roomId: string;
  currentVideoId: string | null;
  currentTime: number;
  isPlaying: boolean;
  host: string | null;
  participants: {
    id: string;
    username: string;
    role: Role;
    isOnline: boolean;
    joinedAt: string;
  }[];
}

interface RoomContext {
  id: string;
  hostId: string | null;
  currentVideoId: string | null;
  currentTime: number;
  isPlaying: boolean;
  participants: Map<string, Participant>;
}

export class RoomManager {
  private io: Server;
  private rooms: Map<string, RoomContext> = new Map();
  private participantIdBySocket: Map<string, string> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  private ensureRoomContext(roomId: string): RoomContext {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        hostId: null,
        currentVideoId: null,
        currentTime: 0,
        isPlaying: false,
        participants: new Map()
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  private async toRoomState(room: RoomContext): Promise<RoomState> {
    const participants = await ParticipantModel.findByRoom(room.id);
    return {
      roomId: room.id,
      currentVideoId: room.currentVideoId,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      host: room.hostId,
      participants: participants.map(p => ({
        id: p.id,
        username: p.username,
        role: p.role,
        isOnline: !!p.is_online,
        joinedAt: p.joined_at
      }))
    };
  }

  async createRoom(hostUsername: string, hostId: string): Promise<string> {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: RoomContext = {
      id: roomId,
      hostId,
      currentVideoId: null,
      currentTime: 0,
      isPlaying: false,
      participants: new Map()
    };
    this.rooms.set(roomId, room);
    await RoomModel.create(roomId, hostId);
    return roomId;
  }

  async joinRoom(socket: Socket, roomId: string, username: string): Promise<void> {
    const socketId = socket.id;
    const roomRecord = await RoomModel.findById(roomId);
    if (!roomRecord) {
      socket.emit("error_message", "Room not found");
      return;
    }

    const room = this.ensureRoomContext(roomId);

    const participantId = `${roomId}-${socketId}`;
    const role: Role = room.hostId ? "participant" : "host";

    const participant = new Participant({
      id: participantId,
      roomId,
      username,
      role,
      socketId
    });

    room.participants.set(participantId, participant);
    this.participantIdBySocket.set(socketId, participantId);

    await ParticipantModel.add({ id: participantId, roomId, username, role });

    if (!room.hostId && role === "host") {
      room.hostId = participantId;
      await RoomModel.updateState(roomId, { hostId: participantId });
    }

    socket.join(roomId);

    const state = await this.toRoomState(room);
    this.io.to(roomId).emit("room_state", state);

    const messages = await MessageModel.findByRoom(roomId, 50);
    messages.forEach(msg => socket.emit("chat_message", msg));
  }

  async leaveRoom(socket: Socket, roomId: string): Promise<void> {
    const participantId = this.participantIdBySocket.get(socket.id);
    if (!participantId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.participants.delete(participantId);
    this.participantIdBySocket.delete(socket.id);

    await ParticipantModel.markOnline(participantId, false);

    if (room.hostId === participantId) {
      const oldest = await ParticipantModel.oldestOnlineParticipant(roomId);
      if (oldest) {
        room.hostId = oldest.id;
        await ParticipantModel.updateRole(oldest.id, "host");
        await RoomModel.updateState(roomId, { hostId: oldest.id });
      } else {
        room.hostId = null;
        await RoomModel.updateState(roomId, { hostId: null });
      }
    }

    const state = await this.toRoomState(room);
    this.io.to(roomId).emit("room_state", state);
  }

  private async requireRole(
    socket: Socket,
    roomId: string,
    roles: Role[]
  ): Promise<{ room: RoomContext; participant: Participant } | null> {
    const participantId = this.participantIdBySocket.get(socket.id);
    if (!participantId) {
      socket.emit("error_message", "Not in room");
      return null;
    }
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit("error_message", "Room not found");
      return null;
    }
    const participant = room.participants.get(participantId);
    if (!participant) {
      socket.emit("error_message", "Participant not found");
      return null;
    }
    if (!roles.includes(participant.role)) {
      socket.emit("error_message", "You are not allowed to perform this action");
      return null;
    }
    return { room, participant };
  }

  async handlePlay(socket: Socket, roomId: string): Promise<void> {
    const ctx = await this.requireRole(socket, roomId, ["host", "moderator"]);
    if (!ctx) return;
    ctx.room.isPlaying = true;
    await RoomModel.updateState(roomId, { isPlaying: true });
    const state = await this.toRoomState(ctx.room);
    this.io.to(roomId).emit("room_state", state);
  }

  async handlePause(socket: Socket, roomId: string): Promise<void> {
    const ctx = await this.requireRole(socket, roomId, ["host", "moderator"]);
    if (!ctx) return;
    ctx.room.isPlaying = false;
    await RoomModel.updateState(roomId, { isPlaying: false });
    const state = await this.toRoomState(ctx.room);
    this.io.to(roomId).emit("room_state", state);
  }

  async handleSeek(socket: Socket, roomId: string, time: number): Promise<void> {
    const ctx = await this.requireRole(socket, roomId, ["host", "moderator"]);
    if (!ctx) return;
    ctx.room.currentTime = time;
    await RoomModel.updateState(roomId, { currentTime: time });
    const state = await this.toRoomState(ctx.room);
    this.io.to(roomId).emit("room_state", state);
  }

  async handleChangeVideo(socket: Socket, roomId: string, rawVideoId: string): Promise<void> {
    const ctx = await this.requireRole(socket, roomId, ["host", "moderator"]);
    if (!ctx) return;
    const videoId = extractYouTubeId(rawVideoId);
    if (!videoId) {
      socket.emit("error_message", "Invalid YouTube URL or ID");
      return;
    }
    ctx.room.currentVideoId = videoId;
    ctx.room.currentTime = 0;
    ctx.room.isPlaying = false;
    await RoomModel.updateState(roomId, {
      currentVideoId: videoId,
      currentTime: 0,
      isPlaying: false
    });
    const state = await this.toRoomState(ctx.room);
    this.io.to(roomId).emit("room_state", state);
  }

  async handleAssignRole(
    socket: Socket,
    roomId: string,
    targetParticipantId: string,
    role: Role
  ): Promise<void> {
    const ctx = await this.requireRole(socket, roomId, ["host"]);
    if (!ctx) return;

    if (role === "host") {
      socket.emit("error_message", "Use transfer_host to change host");
      return;
    }

    const target = ctx.room.participants.get(targetParticipantId);
    if (!target) {
      socket.emit("error_message", "Target participant not found");
      return;
    }

    target.role = role;
    await ParticipantModel.updateRole(target.id, role);

    const state = await this.toRoomState(ctx.room);
    this.io.to(roomId).emit("room_state", state);
  }

  async handleRemoveParticipant(
    socket: Socket,
    roomId: string,
    targetParticipantId: string
  ): Promise<void> {
    const ctx = await this.requireRole(socket, roomId, ["host"]);
    if (!ctx) return;

    const target = ctx.room.participants.get(targetParticipantId);
    if (!target) {
      socket.emit("error_message", "Target participant not found");
      return;
    }

    ctx.room.participants.delete(targetParticipantId);
    await ParticipantModel.remove(targetParticipantId);

    const sockets = await this.io.in(roomId).fetchSockets();
    const targetSocket = sockets.find(s => s.id === target.socketId);
    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.emit("error_message", "You have been removed from the room");
    }

    const state = await this.toRoomState(ctx.room);
    this.io.to(roomId).emit("room_state", state);
  }

  async handleTransferHost(
    socket: Socket,
    roomId: string,
    targetParticipantId: string
  ): Promise<void> {
    const ctx = await this.requireRole(socket, roomId, ["host"]);
    if (!ctx) return;

    const target = ctx.room.participants.get(targetParticipantId);
    if (!target) {
      socket.emit("error_message", "Target participant not found");
      return;
    }

    const currentHostId = ctx.room.hostId;
    if (currentHostId) {
      await ParticipantModel.updateRole(currentHostId, "participant");
      const currentHost = ctx.room.participants.get(currentHostId);
      if (currentHost) currentHost.role = "participant";
    }

    target.role = "host";
    ctx.room.hostId = target.id;
    await ParticipantModel.updateRole(target.id, "host");
    await RoomModel.updateState(roomId, { hostId: target.id });

    const state = await this.toRoomState(ctx.room);
    this.io.to(roomId).emit("room_state", state);
  }

  async handleSyncState(
    socket: Socket,
    roomId: string,
    payload: { currentTime: number; isPlaying: boolean }
  ): Promise<void> {
    const ctx = await this.requireRole(socket, roomId, ["host", "moderator"]);
    if (!ctx) return;
    ctx.room.currentTime = payload.currentTime;
    ctx.room.isPlaying = payload.isPlaying;
    await RoomModel.updateState(roomId, {
      currentTime: payload.currentTime,
      isPlaying: payload.isPlaying
    });
    const state = await this.toRoomState(ctx.room);
    this.io.to(roomId).emit("room_state", state);
  }

  async handleChatMessage(socket: Socket, roomId: string, content: string): Promise<void> {
    const participantId = this.participantIdBySocket.get(socket.id);
    if (!participantId) {
      socket.emit("error_message", "Not in room");
      return;
    }
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit("error_message", "Room not found");
      return;
    }
    const participant = room.participants.get(participantId);
    if (!participant) {
      socket.emit("error_message", "Participant not found");
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) return;
    const msg = await MessageModel.add({
      roomId,
      participantId,
      username: participant.username,
      content: trimmed
    });
    this.io.to(roomId).emit("chat_message", msg);
  }

  async handleReaction(socket: Socket, roomId: string, emoji: string): Promise<void> {
    const participantId = this.participantIdBySocket.get(socket.id);
    if (!participantId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(participantId);
    if (!participant) return;
    const trimmed = emoji.trim();
    if (!trimmed) return;
    this.io.to(roomId).emit("reaction", {
      emoji: trimmed,
      username: participant.username
    });
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const participantId = this.participantIdBySocket.get(socket.id);
    if (!participantId) return;
    this.participantIdBySocket.delete(socket.id);
    for (const room of this.rooms.values()) {
      const participant = room.participants.get(participantId);
      if (participant) {
        room.participants.delete(participantId);
        await ParticipantModel.markOnline(participantId, false);

        if (room.hostId === participantId) {
          const oldest = await ParticipantModel.oldestOnlineParticipant(room.id);
          if (oldest) {
            room.hostId = oldest.id;
            await ParticipantModel.updateRole(oldest.id, "host");
            await RoomModel.updateState(room.id, { hostId: oldest.id });
          } else {
            room.hostId = null;
            await RoomModel.updateState(room.id, { hostId: null });
          }
        }

        const state = await this.toRoomState(room);
        this.io.to(room.id).emit("room_state", state);
        break;
      }
    }
  }
}
