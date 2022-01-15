import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME } from "./constants";
import mikroConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";

const main = async () => {
  // Connect to the postgreSQL database
  const orm = await MikroORM.init(mikroConfig);

  //! Delete all the users/wipe all data
  // await orm.em.nativeDelete(User, {});

  //? Automatically run the migration before anything else
  //? Once you get into production you'll need to synchronize model changes into the database.
  //? Typically it is unsafe to use synchronize: true for schema synchronization on production once you get data in your database.
  //? Here is where migrations come to help.
  //? A migration is just a single file with sql queries to update a database schema and apply new changes to an existing database
  await orm.getMigrator().up();

  const app = express();
  // 'trust proxy' is required in order for the login details to be saved to cache
  app.set("trust proxy", process.env.NODE_ENV !== "production");
  app.use(
    cors({
      credentials: true,
      origin: ["http://localhost:3000", "https://studio.apollographql.com"],
    })
  );

  //? Redis, which stands for Remote Dictionary Server, is a fast, open source, in-memory, key-value data store
  //? In this case, we are using it as a cache store to store the users login data
  // In the documentation, they put the below code (that uses require)
  // const RedisStore = require('connect-redis')(session);
  // This is how you would do it using import
  const RedisStore = connectRedis(session);
  // const redisClient = createClient();
  const redisClient = new Redis();
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10years
        httpOnly: true, // security. Cannot access the cookie in the javascript
        sameSite: "none", // protecting the csrf
        secure: true,
        // secure: __prod__, // cookie will only work in https
      },
      saveUninitialized: false, // create a session by default (even if no data is stored)
      secret: "keyboardcat",
      resave: false,
    })
  );

  // If you want to ignore something in the parameter, so in this case, the 'req'
  // its best practice to put a '_', to display that it is ignored
  // app.get('/', (_, res) => {
  // res.send('hello');
  // });

  //? The Apollo platform is an implementation of GraphQL that can transfer data between the cloud (server) to the UI of your app
  //? In fact, Apollo builds its environment in such a way that we can use it to handle GraphQL on the client as well as the server side of the application.
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      // A resolver is a function(/class?) that's responsible for populating the data for a single field in your schema.
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // context is a special object that is accessible by all the resolvers
    context: ({ req, res }): MyContext => ({
      em: orm.em,
      req,
      res,
      redis: redisClient
    }),
  });

  //* This part is very important
  await apolloServer.start();
  // Creates a graphql endpoint for us in Express
  // localhost:5000/graphql that will be in https://studio.apollographql.com/
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(5000, () => {
    console.log("Server started on port 5000");
  });

  // title is not going to be created automatically/by default, therefore you need to add it
  // const post = orm.em.create(Post, { title: 'My First Post' });

  // Insert post into database
  // await orm.em.persistAndFlush(post);

  // Find posts. Leave the second argument empty to find all posts
  // const posts = await orm.em.find(Post, {});
  // console.log(posts);
};

main();
