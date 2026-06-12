import React, { useState, FormEvent, useRef, useEffect } from "react";
import { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
  onSend: (content: string) => void;
}

const RoomChat: React.FC<Props> = ({ messages, onSend }) => {
  const [value, setValue] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="card" style={{ padding: "0.75rem", display: "flex", flexDirection: "column" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.4rem" }}>Chat</h2>
      <div
        ref={listRef}
        style={{
          flex: 1,
          minHeight: "120px",
          maxHeight: "220px",
          overflowY: "auto",
          paddingRight: "0.25rem",
          marginBottom: "0.5rem"
        }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              marginBottom: "0.35rem",
              fontSize: "0.87rem"
            }}
          >
            <span style={{ fontWeight: 600 }}>{msg.username}: </span>
            <span>{msg.content}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-muted" style={{ fontSize: "0.85rem" }}>
            No messages yet. Start the conversation!
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.4rem" }}>
        <input
          className="input"
          placeholder="Type a message..."
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          Send
        </button>
      </form>
    </div>
  );
};

export default RoomChat;
