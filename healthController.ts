import { Request, Response } from "express";

export const healthHandler = (req: Request, res: Response) => {
  res.json({ status: "ok" });
};
