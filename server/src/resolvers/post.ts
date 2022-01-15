import { MyContext } from "src/types";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "./../entities/Post";

// A Resolver acts as a controller. They act as typical crud queries and mutations.
@Resolver()
export class PostResolver {
  // The first is to add the @Query decorator, which marks the class method as a GraphQL query.
  // The second is to provide the return type. Since the method is async, the reflection metadata system
  // shows the return type as a Promise, so we have to add the decorator's parameter as returns => [Post]
  // to declare it resolves to an array of Post object types
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number, @Ctx() { em }: MyContext): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    // lazy to put try catch on the other mutations above ;p
    try {
      em.nativeDelete(Post, { id });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
