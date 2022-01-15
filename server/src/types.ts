import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";
export type MyContext = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request & {
    // By default, req.session is possibly undefined, the part below
    // will essentially say that it will always be defined
    session: Session & { userId?: number };
  };
  res: Response;
  redis: Redis;
};
