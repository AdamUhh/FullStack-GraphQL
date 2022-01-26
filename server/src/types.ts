import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";

export type MyContext = {
  req: Request & {
    // By default, req.session is possibly undefined, the part below
    // will essentially say that it will always be defined
    session: Session & { userId?: number };
  };
  res: Response;
  redis: Redis;
  // this will automatically give us the return value of a function
  userLoader: ReturnType<typeof createUserLoader>
  updootLoader: ReturnType<typeof createUpdootLoader>
};
