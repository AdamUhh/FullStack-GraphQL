import { MyContext } from "src/types";
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
import { Post } from "./../entities/Post";

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

// A Resolver acts as a controller. They act as typical crud queries and mutations.
@Resolver(Post) // After adding FieldResolver, we need to add 'Post' to the parameter
export class PostResolver {
  // The first is to add the @Query decorator, which marks the class method as a GraphQL query.
  // The second is to provide the return type. Since the method is async, the reflection metadata system
  // shows the return type as a Promise, so we have to add the decorator's parameter as returns => [Post]
  // to declare it resolves to an array of Post object types

  // From this, we convert the 'text' field into a 'textSnippet' field
  // to only take a small amount of text/data from the database
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    let str = root.text;
    return str.length > 50 ? str.slice(0, 50 - 1).trim() + "..." : str;
    // return root.text.slice(0, 50);
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

    // how many posts to fetch - up to/limit is determined by take()
    const queryBuilder = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p") // an alias of what we want to call this
      .orderBy('"createdAt"', "DESC") // double and single quotes is required in order to reference the createdAt column
      .take(realLimitPlusOne); //for pagination, its better to use take() instead of limit()

    // Because its newest first, when you paginate, you will take the older posts
    if (cursor) {
      queryBuilder.where('"createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const posts = await queryBuilder.getMany(); // getting the posts - upto 21 posts

    return {
      posts: posts.slice(0, realLimit), // give the users 20 instead of 21 posts
      hasMore: posts.length === realLimitPlusOne, // if both are equal, it means we have more posts
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | undefined> {
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
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | undefined> {
    const post = await Post.findOne(id);
    if (!post) {
      return undefined;
    }
    if (typeof title !== "undefined") {
      Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
