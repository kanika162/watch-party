import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { useUser } from "../context/UserContext";
import { useRoom } from "../hooks/useRoom";
import ParticipantList from "../components/ParticipantList";
import RoomChat from "../components/RoomChat";
import EmojiReactions from "../components/EmojiReactions";
import VideoControls from "../components/VideoControls";
import { showGlobalToast } from "../components/Toast";

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { username } = useUser();

  const {
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
  } = useRoom({ roomId: roomId! });

  const playerRef = React.useRef<YouTubePlayer | null>(null);
  const lastSyncedRef = React.useRef<{ time: number; playing: boolean } | null>(null);

  useEffect(() => {
    if (error) {
      showGlobalToast(error, "error");
    }
  }, [error]);

  useEffect(() => {
    if (roomState && playerRef.current) {
      const player = playerRef.current;
      const targetTime = roomState.currentTime;
      const targetPlaying = roomState.isPlaying;

      player.getCurrentTime().then(current => {
        if (Math.abs(current - targetTime) > 1.0) {
          player.seekTo(targetTime, true);
        }
      });

      player.getPlayerState().then(state => {
        const isPlaying = state === 1;
        if (targetPlaying && !isPlaying) {
          player.playVideo();
        }
        if (!targetPlaying && isPlaying) {
          player.pauseVideo();
        }
      });
    }
  }, [roomState?.currentTime, roomState?.isPlaying, roomState?.currentVideoId]);

  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event: YouTubeEvent) => {
    const player = event.target;
    const playerState = event.data;
    const shouldControl = currentUserRole === "host" || currentUserRole === "moderator";
    if (!shouldControl) {
      return;
    }

    if (playerState === 1) {
      sendPlay();
    } else if (playerState === 2) {
      sendPause();
    }

    player.getCurrentTime().then(time => {
      const last = lastSyncedRef.current;
      if (!last || Math.abs(last.time - time) > 2) {
        sendSeek(time);
        lastSyncedRef.current = { time, playing: playerState === 1 };
      }
    });
  };

  const copyInviteLink = () => {
    if (!roomId) return;
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link).then(
      () => showGlobalToast("Invite link copied to clipboard", "success"),
      () => showGlobalToast("Failed to copy link", "error")
    );
  };

  const currentUser = useMemo(
    () => roomState?.participants.find(p => p.username === username),
    [roomState, username]
  );

  if (!roomId) {
    return <div>Invalid room ID</div>;
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }} className="grid grid-2">
      <section style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="card" style={{ padding: "0.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "0.4rem"
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                Room <span style={{ fontFamily: "monospace" }}>{roomId}</span>
              </h1>
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                Share this code or copy the invite link to invite friends.
              </p>
            </div>
            <button className="btn btn-ghost" type="button" onClick={copyInviteLink}>
              Copy invite link
            </button>
          </div>

          <VideoControls
            role={currentUserRole}
            onPlay={sendPlay}
            onPause={sendPause}
            onSeek={sendSeek}
            onChangeVideo={sendChangeVideo}
            currentVideoId={roomState?.currentVideoId ?? null}
          />

          <div
            style={{
              position: "relative",
              paddingTop: "56.25%",
              borderRadius: "0.75rem",
              overflow: "hidden",
              background: "black"
            }}
          >
            {roomState?.currentVideoId ? (
              <div style={{ position: "absolute", inset: 0 }}>
                <YouTube
                  videoId={roomState.currentVideoId}
                  opts={{
                    width: "100%",
                    height: "100%",
                    playerVars: { autoplay: 0 }
                  }}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                />
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <div style={{ opacity: 0.8 }}>No video loaded yet.</div>
                {currentUserRole === "host" || currentUserRole === "moderator" ? (
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    Paste a YouTube URL above to get started.
                  </div>
                ) : (
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    Waiting for host or moderator to load a video.
                  </div>
                )}
              </div>
            )}
          </div>

          <EmojiReactions onReact={sendReaction} reactions={reactions} />
          {!connected && (
            <div className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
              Reconnecting to room...
            </div>
          )}
        </div>
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <ParticipantList
          participants={roomState?.participants ?? []}
          currentUserRole={currentUserRole}
          onAssignRole={assignRole}
          onRemove={removeParticipant}
          onTransferHost={transferHost}
          currentUserId={currentUser?.id}
        />
        <RoomChat messages={chatMessages} onSend={sendChatMessage} />
      </section>
    </div>
  );
};

export default RoomPage;
