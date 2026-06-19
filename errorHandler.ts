import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logError(err);
  res.status(500).json({ error: "Internal server error" });
};
