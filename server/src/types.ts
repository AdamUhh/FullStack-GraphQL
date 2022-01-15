import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";
export type MyContext = {
  req: Request & {
    // By default, req.session is possibly undefined, the part below
    // will essentially say that it will always be defined
    session: Session & { userId?: number };
  };
  res: Response;
  redis: Redis;
};
