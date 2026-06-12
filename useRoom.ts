import { useEffect, useState, useCallback, useRef } from "react";
import { socket } from "../socket/socket";
import { RoomState, ChatMessage, ReactionEvent, Role } from "../types";
import { useUser } from "../context/UserContext";

interface UseRoomParams {
  roomId: string;
}

export const useRoom = ({ roomId }: UseRoomParams) => {
  const { username } = useUser();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectingRef = useRef(false);

  useEffect(() => {
    if (!username) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setConnected(true);
      reconnectingRef.current = false;
      socket.emit("join_room", { roomId, username });
    };

    const handleDisconnect = () => {
      setConnected(false);
      reconnectingRef.current = true;
    };

    const handleRoomState = (state: RoomState) => {
      setRoomState(state);
    };

    const handleErrorMessage = (msg: string) => {
      setError(msg);
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
    };

    const handleReaction = (payload: ReactionEvent) => {
      setReactions(prev => [...prev.slice(-10), payload]);
      setTimeout(() => {
        setReactions(curr => curr.filter(r => r !== payload));
      }, 2000);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room_state", handleRoomState);
    socket.on("error_message", handleErrorMessage);
    socket.on("chat_message", handleChatMessage);
    socket.on("reaction", handleReaction);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.emit("leave_room", { roomId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room_state", handleRoomState);
      socket.off("error_message", handleErrorMessage);
      socket.off("chat_message", handleChatMessage);
      socket.off("reaction", handleReaction);
    };
  }, [roomId, username]);

  const sendPlay = useCallback(() => {
    socket.emit("play", { roomId });
  }, [roomId]);

  const sendPause = useCallback(() => {
    socket.emit("pause", { roomId });
  }, [roomId]);

  const sendSeek = useCallback(
    (time: number) => {
      socket.emit("seek", { roomId, time });
    },
    [roomId]
  );

  const sendChangeVideo = useCallback(
    (videoId: string) => {
      socket.emit("change_video", { roomId, videoId });
    },
    [roomId]
  );

  const assignRole = useCallback(
    (participantId: string, role: Role) => {
      socket.emit("assign_role", { roomId, participantId, role });
    },
    [roomId]
  );

  const removeParticipant = useCallback(
    (participantId: string) => {
      socket.emit("remove_participant", { roomId, participantId });
    },
    [roomId]
  );

  const transferHost = useCallback(
    (participantId: string) => {
      socket.emit("transfer_host", { roomId, participantId });
    },
    [roomId]
  );

  const sendChatMessage = useCallback(
    (content: string) => {
      socket.emit("chat_message", { roomId, content });
    },
    [roomId]
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      socket.emit("reaction", { roomId, emoji });
    },
    [roomId]
  );

  const currentUserRole: Role | null = (() => {
    if (!roomState || !username) return null;
    const me = roomState.participants.find(p => p.username === username);
    return me?.role ?? null;
  })();

  return {
    roomState,
    chatMessages,
    reactions,
    connected,
    error,
    currentUserRole,
    sendPlay,
    sendPause,
    sendSeek,
    sendChangeVideo,
    assignRole,
    removeParticipant,
    transferHost,
    sendChatMessage,
    sendReaction
  };
};
