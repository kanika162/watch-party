import React from "react";
import { Participant, Role } from "../types";

interface Props {
  participants: Participant[];
  currentUserRole: Role | null;
  onAssignRole: (participantId: string, role: Role) => void;
  onRemove: (participantId: string) => void;
  onTransferHost: (participantId: string) => void;
  currentUserId?: string | null;
}

const roleLabel = (role: Role) =>
  role === "host" ? "Host" : role === "moderator" ? "Mod" : "Viewer";

const ParticipantList: React.FC<Props> = ({
  participants,
  currentUserRole,
  onAssignRole,
  onRemove,
  onTransferHost,
  currentUserId
}) => {
  return (
    <div className="card" style={{ padding: "1rem", height: "100%", overflow: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.6rem"
        }}
      >
        <h2 style={{ fontSize: "1.05rem", fontWeight: 600 }}>Participants</h2>
        <span className="text-muted" style={{ fontSize: "0.85rem" }}>
          {participants.length} online
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {participants.map(p => (
          <div
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.4rem 0.2rem",
              borderBottom: "1px solid rgba(148,163,184,0.2)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "999px",
                  background: p.isOnline ? "#22c55e" : "#9ca3af"
                }}
              />
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 500 }}>
                  {p.username}
                  {p.id === currentUserId && (
                    <span className="text-muted" style={{ fontSize: "0.8rem", marginLeft: 4 }}>
                      (you)
                    </span>
                  )}
                </div>
                <span
                  className={`badge ${
                    p.role === "host"
                      ? "badge-host"
                      : p.role === "moderator"
                      ? "badge-moderator"
                      : "badge-participant"
                  }`}
                >
                  {roleLabel(p.role)}
                </span>
              </div>
            </div>
            {currentUserRole === "host" && p.id !== currentUserId && (
              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                {p.role !== "host" && (
                  <>
                    <select
                      value={p.role}
                      onChange={e => onAssignRole(p.id, e.target.value as Role)}
                      style={{
                        borderRadius: "999px",
                        border: "1px solid rgba(148,163,184,0.5)",
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.4rem",
                        background: "transparent"
                      }}
                    >
                      <option value="participant">Viewer</option>
                      <option value="moderator">Moderator</option>
                    </select>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: "0.75rem", padding: "0.1rem 0.4rem" }}
                      onClick={() => onTransferHost(p.id)}
                    >
                      Make host
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: "0.75rem", padding: "0.1rem 0.4rem" }}
                      onClick={() => onRemove(p.id)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantList;
