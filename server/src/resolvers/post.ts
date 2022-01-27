import { Updoot } from "../entities/Updoot";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { isAuth } from "../middleware/isAuth";
import { Post } from "../entities/Post";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

// For whether we have more items/posts
@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean; // whether there is more items in the list
}

//@note: A Resolver acts as a controller. They act as typical crud queries and mutations.
@Resolver(Post) // After adding FieldResolver, we need to add 'Post' to the parameter
export class PostResolver {
  // The first is to add the @Query decorator, which marks the class method as a GraphQL query.
  // The second is to provide the return type. Since the method is async, the reflection metadata system
  // shows the return type as a Promise, so we have to add the decorator's parameter as returns => [Post]
  // to declare it resolves to an array of Post object types

  // From my understanding, you can essentially run code/conditions on a field
  // so in this case, we made a field called textSnippet that makes use of the text field
  // to run a condition to only take a small amount of text/data from the database
  // note: Field Resolvers only run if you include it in the query
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    let str = root.text;
    return str.length > 50 ? str.slice(0, 50 - 1).trim() + "..." : str;
    // return root.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    // ? this creator function is gonna be called on all queries
    // so the dataloader will batch all the userId's into a single function call
    // which are put into an array of numbers, which is then handled
    // inside userLoader
    return userLoader.load(post.creatorId);

    // return User.findOne(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { req, updootLoader }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    // if user didnt vote, return null, else a 1 or -1
    return updoot ? updoot.value : null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    // This is to prevent people from somehow passing in custom values
    // such as 13 or -13, which means 13 upvotes / 13 downvotes
    // it will convert it to 1 upvote / -1 downvote
    const isUpdoot = value !== -1; // is it an upvote
    const realValue = isUpdoot ? 1 : -1; //if its an upvote, assign 1, else -1
    const { userId } = req.session; // getting the userId

    // Check if the user already voted for this particular postId
    // will be something like this: 'Updoot { value: -1, userId: 1, postId: 411 }' or 'undefined'
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // ? The user has voted on the post before
    // ?? if the updoot value is 1 and they are trying to change their vote (to downvote)
    if (updoot && updoot.value !== realValue) {
      console.log("!==");

      // ?? tm -> transaction manager object - allows us to query stuff
      // ? catch the error and rollback the transaction (if we get an error)
      await getConnection().transaction(async (tm) => {
        // ? update updoot, set the value to realValue(either 1 or -1)
        // ? where the updoot's id's match the provided variables
        // ?? updoot is the users vote to this particular post
        // ?? so for each post per user, it can only be a 1, 0, or -1
        await tm.query(
          `
          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        // ? update the points on the post
        // ?? update the Post.points table where id = postId by adding the realValue to it
        // ?? this is saving the points to the actual Posts table
        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2
        `,
        [updoot.value === 0 ? realValue : 2 * realValue, postId]
          // [2 * realValue, postId]
          // ?? 2 * because if they already upvoted and they click downvote, it will go to -1 and not 0
          // ?? 0 if the user voted and unvoted, we need this logic or else it will calculate votes incorrectly (will be -2 instead of -1)
        );
      });
    }
    // ? The user has voted on the post before
    // ?? if the updoot value is 1 and they click on it again, it will reset to 0
    // @note: create this yourself since it seems he didnt account for it
    // ! @note: Add this part later, at the end of the tutorial, since he is still editing it later on
    else if (updoot && updoot.value === realValue) {
      console.log("===");
      console.log('updoot.value', updoot.value);
      console.log("realValue", realValue);
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3
          `,
          [0, postId, userId]
        );

        // ?? update the points on the post
        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2
          `,
          [-1 * realValue, postId]
        );
      });
    } else if (!updoot) {
      // they have not voted before
      await getConnection().transaction(async (tm) => {
        // insert the new values
        await tm.query(
          `
          insert into updoot ("userId", "postId", value)
          values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );
        // The sql is essentially this:
        // await Updoot.insert({ userId, postId, value: realValue });

        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2
        `,
          [realValue, postId]
        );
      });
    }

    // ?? Transactions are a fundamental concept of all database systems.
    // ?? The essential point of a transaction is that it bundles multiple steps into a single,
    // ?? all-or-nothing operation. The intermediate states between the steps are not visible to other concurrent
    // ?? transactions, and if some failure occurs that prevents the transaction from completing,
    // ?? then none of the steps affect the database at all.
    // ?? insert into updoot.userId, updoot.postId, updoot.value with the corresponding values
    // ?? update the Post.points table where id = postId by adding the realValue to it
    // await getConnection().query(
    //   `
    //     START TRANSACTION;

    //     insert into updoot ("userId", "postId", value)
    //     values (${userId},${postId},${realValue});

    //     update post
    //     set points = points + ${realValue}
    //     where id = ${postId};

    //     COMMIT;
    //   `
    // );

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    // Adding pagination
    @Arg("limit", () => Int) limit: number,
    // first time we fetch post, we wont have a cursor, so it might be null (hence nullable)
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null //ex: give me the posts after this point
    // @Arg("offset") offset: number //ex: give me the posts after the tenth post
  ): Promise<PaginatedPosts> {
    // return Post.find();

    // ex: if the user asks for 20posts, then in reality, we are fetching 21 posts
    // We can check by the number of posts that we get back whether we get 21 posts,
    // and that means there is more posts to be shown
    const realLimitPlusOne = Math.min(50, limit) + 1;

    const realLimit = Math.min(50, limit);

    let replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    // ?? In postgres, there are multiple user tables, so we just gotta specify that we want the public schema
    // ?? if there is a cursor, get data where post.createdAt is lesser than cursor date value
    // ?? order createdAt in descending order
    // ?? limit number of posts we can get

    // with this approach, 16 queries will be run to get the posts
    // therefore, we need to use something called dataloader to reduce this
    // by patching it into a single sql statement, one for the post and one for the creator (@FieldResolver)
    const posts = await getConnection().query(
      `
    select p.*
    from post p
    ${cursor ? `where p."createdAt" < $2` : ""}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    // Previous way using queryBuilder (inner join was not working so he moved to SQL)
    // how many posts to fetch - up to/limit is determined by take()
    // const queryBuilder = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p") // an alias of what we want to call this
    //    REMOVE innerJoinAndSelect and replace all p."createdAt" to just "createdAt" for this to work again
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"', {
    //     isRemoved: false,
    //   }) // fetch the creator ('User') of the post
    //   .orderBy('p."createdAt"', "DESC") // double and single quotes is required in order to reference the createdAt column
    //   .take(realLimitPlusOne); //for pagination, its better to use take() instead of limit()

    // Because its newest first, when you paginate, you will take the older posts
    // if (cursor) {
    //   queryBuilder.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }
    // const posts = await queryBuilder.getMany(); // getting the posts - upto 21 posts

    return {
      posts: posts.slice(0, realLimit), // give the users 20 instead of 21 posts
      hasMore: posts.length === realLimitPlusOne, // if both are equal, it means we have more posts
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    // ?? the reason we used sql instead of this (in Query posts)
    // ?? is because that is more complicated, and using the below
    // ?? for complicated stuff does not generate good sql
    // ?? so we create the sql ourselves
    // ?? but for simple things where we are just fetching a single relationship
    // ?? the below works
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    // Middleware was used to check if the user is authenticated instead
    // if (!req.session.userId) {
    //   throw new Error('Not Authenticated')
    // }

    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0]; // found out to use 'raw[0]' from outputting result
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // * start of first method (to delete post)
    // this method is more explicit in choosing what to delete (more safer)
    // find the post with id
    const post = await Post.findOne(id);
    if (!post) return false;
    // check if the posts creatorId and the current userId match
    if (post.creatorId !== req.session.userId)
      throw new Error("Not Authorized");

    // delete any voting data for that post from updoot
    await Updoot.delete({ postId: id });

    // delete post
    await Post.delete({ id });
    // * end of first method

    // * start of cascade method
    // with the cascade method, we can tell postgresql automatically
    // delete any updoots for us that are connected to this post
    // by telling it that we want to cascade
    // @note: must enable cascade option inside /entities/Updoot.ts/ -> ManyToOne(Post)
    // await Post.delete({ id, creatorId: req.session.userId });

    // * end of cascade method
    return true;
  }
}
