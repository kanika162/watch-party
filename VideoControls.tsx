import React, { FormEvent, useState } from "react";
import { Role } from "../types";

interface Props {
  role: Role | null;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onChangeVideo: (videoId: string) => void;
  currentVideoId: string | null;
}

const extractVideoId = (urlOrId: string): string | null => {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("http")) {
    return trimmed;
  }
  const url = new URL(trimmed);
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.replace("/", "");
  }
  if (url.searchParams.get("v")) return url.searchParams.get("v");
  return null;
};

const VideoControls: React.FC<Props> = ({
  role,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  currentVideoId
}) => {
  const [urlInput, setUrlInput] = useState("");

  const isController = role === "host" || role === "moderator";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isController) return;
    const videoId = extractVideoId(urlInput);
    if (!videoId) {
      alert("Invalid YouTube URL or ID");
      return;
    }
    onChangeVideo(videoId);
    setUrlInput("");
  };

  return (
    <div className="card" style={{ padding: "0.75rem", marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 600 }}>Video controls</h2>
        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
          {role === "host"
            ? "Host"
            : role === "moderator"
            ? "Moderator"
            : "View only (host/mod only)"}
        </span>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
      >
        <input
          className="input"
          placeholder="Paste YouTube URL or video ID"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          disabled={!isController}
        />
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isController}
            style={{ opacity: isController ? 1 : 0.5 }}
          >
            Load video
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!isController || !currentVideoId}
            style={{ opacity: isController && currentVideoId ? 1 : 0.5 }}
            onClick={onPlay}
          >
            ▶ Play
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!isController || !currentVideoId}
            style={{ opacity: isController && currentVideoId ? 1 : 0.5 }}
            onClick={onPause}
          >
            ⏸ Pause
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!isController || !currentVideoId}
            style={{ opacity: isController && currentVideoId ? 1 : 0.5 }}
            onClick={() => {
              const timeStr = prompt("Seek to (seconds):");
              if (!timeStr) return;
              const t = Number(timeStr);
              if (!Number.isFinite(t) || t < 0) return;
              onSeek(t);
            }}
          >
            ⏩ Seek
          </button>
        </div>
      </form>
    </div>
  );
};

export default VideoControls;
