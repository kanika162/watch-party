import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { createRoom, joinRoom } from "../services/api";
import { showGlobalToast } from "../components/Toast";

const HomePage: React.FC = () => {
  const { username, setUsername } = useUser();
  const [usernameInput, setUsernameInput] = useState(username);
  const [roomCode, setRoomCode] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const navigate = useNavigate();

  const ensureUsername = (): boolean => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      showGlobalToast("Please enter a username first", "error");
      return false;
    }
    setUsername(trimmed);
    return true;
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!ensureUsername()) return;
    try {
      setLoadingCreate(true);
      const res = await createRoom(usernameInput.trim());
      navigate(`/room/${res.roomId}`);
    } catch (err: any) {
      showGlobalToast(err.message || "Failed to create room", "error");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!ensureUsername()) return;
    const trimmedRoom = roomCode.trim();
    if (!trimmedRoom) {
      showGlobalToast("Enter a room code to join", "error");
      return;
    }
    try {
      setLoadingJoin(true);
      const res = await joinRoom(trimmedRoom, usernameInput.trim());
      navigate(`/room/${res.roomId}`);
    } catch (err: any) {
      showGlobalToast(err.message || "Failed to join room", "error");
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
        gap: "2rem"
      }}
    >
      <section style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h1
          style={{
            fontSize: "2.2rem",
            lineHeight: 1.2,
            marginBottom: "0.7rem",
            fontWeight: 800
          }}
        >
          Watch YouTube together,{" "}
          <span style={{ background: "linear-gradient(90deg,#3b82f6,#ec4899)", WebkitBackgroundClip: "text", color: "transparent" }}>
            in sync
          </span>
          .
        </h1>
        <p className="text-muted" style={{ marginBottom: "1.4rem", maxWidth: "480px" }}>
          Create a room, send the invite link, and enjoy videos with perfectly synchronized
          playback, chat, and reactions.
        </p>
        <ul className="text-muted" style={{ fontSize: "0.92rem", marginBottom: "1.5rem" }}>
          <li>• Host and moderator controls for play/pause/seek/video changes</li>
          <li>• Realtime chat and emoji reactions</li>
          <li>• Automatic host transfer if the host disconnects</li>
        </ul>
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="card" style={{ padding: "1.1rem" }}>
          <form
            onSubmit={handleCreate}
            style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Start a watch party</h2>
            <input
              className="input"
              placeholder="Your username"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={loadingCreate}>
              {loadingCreate ? "Creating room..." : "Create new room"}
            </button>
          </form>
        </div>
        <div className="card" style={{ padding: "1.1rem" }}>
          <form
            onSubmit={handleJoin}
            style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Join an existing room</h2>
            <input
              className="input"
              placeholder="Enter room code"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value)}
            />
            <button className="btn btn-ghost" type="submit" disabled={loadingJoin}>
              {loadingJoin ? "Joining..." : "Join room"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
