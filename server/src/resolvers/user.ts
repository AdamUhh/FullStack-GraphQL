import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { getConnection } from "typeorm";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { sendEmail } from "../utils/sendEmail";
import { validateRegister } from "../utils/validateRegister";
import { User } from "./../entities/User";
import { MyContext } from "./../types";
import { UsernamePasswordInput } from "./UsernamePasswordInput";

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  // ? means optional and means that it can be undefined - When adding this, {nullable: true} must also be added
  // user will be returned if it worked properly
  // else an error instead with a field (title of error) and message that explains the error
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // You are not logged in
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Query(() => [User])
  async findUsers(): Promise<User[]> {
    return await User.find();
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { req, redis }: MyContext
  ): Promise<UserResponse> {
    // Validate
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 3",
          },
        ],
      };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    // check if the token is valid
    const userId = await redis.get(key);
    if (!userId)
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if (!user)
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };

    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    // remove the key from redis, so the user cannot use the same token
    // to change the password again
    await redis.del(key);

    // log in user after changing password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    // check if user exists in database with provided email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // email is not in the database
      return true;
    }

    // token = "kjb2k3g4lvc8dfnhgkj4";
    const token = v4();
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24
    ); // user has 1 day to reset password before token expires

    sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async register(
    // UsernamePasswordInput is an InputType, that we only use for @Mutation
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // Validation
    const errors = validateRegister(options);
    if (errors) return { errors };

    // Hashing the users password before saving to database
    const hashedPassword = await argon2.hash(options.password);

    let user;
    
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning("*") //sql syntax to return all the fields from the user
        .execute();
      user = result.raw[0];
    } catch (error) {
      // validation for duplicate username error
      if (error.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username is already taken",
            },
          ],
        };
      }
      console.log("message:", error.message);
    }

    // Required in order to store userId cache
    req.headers["x-forwarded-proto"] = "https";
    // store user id session
    // this will set a cookie on the user and keep them logged in
    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // checking database for username
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    // validation if user does not exist
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username doesnt exist",
          },
        ],
      };
    }
    // verifying that hashed password (that was found while searching for the username) matches provided password
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password/username",
          },
        ],
      };
    }

    // Required in order for cors to work with localhost to store userId cache
    req.headers["x-forwarded-proto"] = "https";
    // store user id session
    // this will set a cookie on the user and keep them logged in
    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }

  @Mutation(() => Boolean)
  async deleteUser(@Arg("id") id: number): Promise<boolean> {
    try {
      User.delete(id);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}

//! Before adding the email
// import { User } from "./../entities/User";
// import { MyContext } from "./../types";
// import {
//   Resolver,
//   Mutation,
//   Query,
//   InputType,
//   Field,
//   Arg,
//   Ctx,
//   ObjectType,
// } from "type-graphql";
// import argon2 from "argon2";
// import { EntityManager } from "@mikro-orm/postgresql";
// import { COOKIE_NAME } from "../constants";

// // Mostly used for @Mutation
// @InputType()
// class UsernamePasswordInput {
//   @Field()
//   username: string;

//   @Field()
//   password: string;
// }

// @ObjectType()
// class FieldError {
//   @Field()
//   field: string;
//   @Field()
//   message: string;
// }

// @ObjectType()
// class UserResponse {
//   // ? means optional and means that it can be undefined - When adding this, {nullable: true} must also be added
//   // user will be returned if it worked properly
//   // else an error instead with a field (title of error) and message that explains the error
//   @Field(() => [FieldError], { nullable: true })
//   errors?: FieldError[];

//   @Field(() => User, { nullable: true })
//   user?: User;
// }

// @Resolver()
// export class UserResolver {
//   @Query(() => User, { nullable: true })
//   async me(@Ctx() { em, req }: MyContext) {
//     // You are not logged in
//     if (!req.session.userId) {
//       return null;
//     }
//     const user = await em.findOne(User, { id: req.session.userId });
//     return user;
//   }
//   @Query(() => [User])
//   async findUsers(@Ctx() { em }: MyContext): Promise<User[]> {
//     return await em.find(User, {});
//   }

//   @Mutation(() => Boolean)
//   async forgotPassword(
//     @Arg("email") email: string,
//     @Ctx() { em }: MyContext
//   ) {
//     // const user = await em.findOne(User, { email });
//     return true;
//   }

//   @Mutation(() => UserResponse)
//   async register(
//     // UsernamePasswordInput is an InputType, that we only use for @Mutation
//     @Arg("options") options: UsernamePasswordInput,
//     @Ctx() { em, req }: MyContext
//   ): Promise<UserResponse> {
//     // Validation
//     if (options.username.length <= 2) {
//       return {
//         errors: [
//           {
//             field: "username",
//             message: "length must be greater than 3",
//           },
//         ],
//       };
//     }
//     if (options.password.length <= 2) {
//       return {
//         errors: [
//           {
//             field: "password",
//             message: "length must be greater than 3",
//           },
//         ],
//       };
//     }
//     // Hashing the users password before saving to database
//     const hashedPassword = await argon2.hash(options.password);
//     // const user = em.create(User, { username: options.username, password: hashedPassword, });
//     let user;
//     try {
//       // When you need to execute some SQL query without all the ORM stuff involved,
//       // you can either compose the query yourself, or use the QueryBuilder helper
//       // to construct the query for you: (Under the hood, QueryBuilder uses Knex.js to compose and run queries)
//       // Instead of createdAt and updatedAt (like how we called it) inside /server/src/entities/User.ts/
//       // mikro-orm converts it to underscores instead of camelCase, and Knex does not know this
//       // Therefore, we also need to tell it what the column is in the database (created_at and updated_at)
//       // https://mikro-orm.io/docs/query-builder/
//       const result = await (em as EntityManager)
//         .createQueryBuilder(User)
//         .getKnexQuery() // instance of Knex' QueryBuilder
//         .insert({
//           username: options.username,
//           password: hashedPassword,
//           created_at: new Date(),
//           updated_at: new Date(),
//         })
//         .returning("*"); //sql syntax to return all the fields from the user
//       user = result[0]; // first element of the result
//     } catch (error) {
//       // || error.detail.includes("already exists")
//       // validation for duplicate username error
//       if (error.code === "23505") {
//         return {
//           errors: [
//             {
//               field: "username",
//               message: "username is already taken",
//             },
//           ],
//         };
//       }
//       console.log("message:", error.message);
//     }

//     // Required in order to store userId cache
//     req.headers["x-forwarded-proto"] = "https";
//     // store user id session
//     // this will set a cookie on the user and keep them logged in
//     req.session.userId = user.id;

//     return {
//       user,
//     };
//   }

//   @Mutation(() => UserResponse)
//   async login(
//     @Arg("options") options: UsernamePasswordInput,
//     @Ctx() { em, req }: MyContext
//   ): Promise<UserResponse> {
//     // checking database for username
//     const user = await em.findOne(User, { username: options.username });
//     // validation if user does not exist
//     if (!user) {
//       return {
//         errors: [
//           {
//             field: "username",
//             message: "that username doesnt exist",
//           },
//         ],
//       };
//     }
//     // verifying that hashed password (that was found while searching for the username) matches provided password
//     const valid = await argon2.verify(user.password, options.password);
//     if (!valid) {
//       return {
//         errors: [
//           {
//             field: "password",
//             message: "incorrect password/username",
//           },
//         ],
//       };
//     }

//     // Required in order for cors to work with localhost to store userId cache
//     req.headers["x-forwarded-proto"] = "https";
//     // store user id session
//     // this will set a cookie on the user and keep them logged in
//     req.session.userId = user.id;

//     console.log(req.header("X-Forwarded-Proto"));
//     return {
//       user,
//     };
//   }

//   @Mutation(() => Boolean)
//   logout(@Ctx() { req, res }: MyContext) {
//     return new Promise((resolve) =>
//       req.session.destroy((err) => {
//         res.clearCookie(COOKIE_NAME);
//         if (err) {
//           console.log(err);
//           resolve(false);
//           return;
//         }
//         resolve(true);
//       })
//     );
//   }

//   @Mutation(() => Boolean)
//   async deleteUser(
//     @Arg("id") id: number,
//     @Ctx() { em }: MyContext
//   ): Promise<boolean> {
//     try {
//       em.nativeDelete(User, { id });
//       return true;
//     } catch (err) {
//       console.log(err);
//       return false;
//     }
//   }
// }
