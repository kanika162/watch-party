export interface CreateRoomResponse {
  roomId: string;
}

export interface JoinRoomResponse {
  roomId: string;
}

const API_BASE = "/api";

export async function createRoom(username: string): Promise<CreateRoomResponse> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create room");
  }
  return res.json();
}

export async function joinRoom(roomId: string, username: string): Promise<JoinRoomResponse> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to join room");
  }
  return res.json();
}
