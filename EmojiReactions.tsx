import React from "react";
import { ReactionEvent } from "../types";

interface Props {
  onReact: (emoji: string) => void;
  reactions: ReactionEvent[];
}

const EMOJIS = ["👏", "😂", "🔥", "❤️", "😮"];

const EmojiReactions: React.FC<Props> = ({ onReact, reactions }) => {
  return (
    <div
      style={{
        position: "relative",
        marginTop: "0.5rem"
      }}
    >
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            type="button"
            className="btn btn-ghost"
            style={{
              padding: "0.15rem 0.4rem",
              fontSize: "1.2rem",
              lineHeight: 1
            }}
            onClick={() => onReact(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden"
        }}
      >
        {reactions.map((r, idx) => (
          <div
            key={`${r.username}-${idx}-${r.emoji}`}
            style={{
              position: "absolute",
              bottom: "0",
              left: `${10 + (idx % 5) * 15}%`,
              animation: "floatUp 2s ease-out forwards",
              fontSize: "1.6rem"
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes floatUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-40px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EmojiReactions;
