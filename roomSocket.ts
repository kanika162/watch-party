import { Server } from "socket.io";
import { RoomManager } from "../services/RoomManager";
import { log } from "../utils/logger";

export const setupRoomSocket = (io: Server) => {
  const roomManager = new RoomManager(io);

  io.on("connection", socket => {
    log("Socket connected", socket.id);

    socket.on("join_room", async ({ roomId, username }) => {
      try {
        await roomManager.joinRoom(socket, roomId, username);
      } catch (err) {
        console.error(err);
        socket.emit("error_message", "Unable to join room");
      }
    });

    socket.on("leave_room", async ({ roomId }) => {
      try {
        await roomManager.leaveRoom(socket, roomId);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("play", async ({ roomId }) => {
      await roomManager.handlePlay(socket, roomId);
    });

    socket.on("pause", async ({ roomId }) => {
      await roomManager.handlePause(socket, roomId);
    });

    socket.on("seek", async ({ roomId, time }) => {
      await roomManager.handleSeek(socket, roomId, time);
    });

    socket.on("change_video", async ({ roomId, videoId }) => {
      await roomManager.handleChangeVideo(socket, roomId, videoId);
    });

    socket.on("assign_role", async ({ roomId, participantId, role }) => {
      await roomManager.handleAssignRole(socket, roomId, participantId, role);
    });

    socket.on("remove_participant", async ({ roomId, participantId }) => {
      await roomManager.handleRemoveParticipant(socket, roomId, participantId);
    });

    socket.on("transfer_host", async ({ roomId, participantId }) => {
      await roomManager.handleTransferHost(socket, roomId, participantId);
    });

    socket.on("sync_state", async ({ roomId, currentTime, isPlaying }) => {
      await roomManager.handleSyncState(socket, roomId, { currentTime, isPlaying });
    });

    socket.on("chat_message", async ({ roomId, content }) => {
      await roomManager.handleChatMessage(socket, roomId, content);
    });

    socket.on("reaction", async ({ roomId, emoji }) => {
      await roomManager.handleReaction(socket, roomId, emoji);
    });

    socket.on("disconnect", async () => {
      await roomManager.handleDisconnect(socket);
      log("Socket disconnected", socket.id);
    });
  });
};
