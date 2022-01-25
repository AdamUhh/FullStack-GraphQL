import { MyContext } from "../types";
import { MiddlewareFn } from "type-graphql";

// Runs before the resolver
// check if the user is authenticated
export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("Not Authenticated");
  }

  return next();
};
