import { Role } from "../models/ParticipantModel";

export class Participant {
  id: string;
  roomId: string;
  username: string;
  role: Role;
  socketId: string;
  joinedAt: Date;

  constructor(params: {
    id: string;
    roomId: string;
    username: string;
    role: Role;
    socketId: string;
  }) {
    this.id = params.id;
    this.roomId = params.roomId;
    this.username = params.username;
    this.role = params.role;
    this.socketId = params.socketId;
    this.joinedAt = new Date();
  }
}
