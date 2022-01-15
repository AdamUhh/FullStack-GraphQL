import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "./../entities/Post";

// A Resolver acts as a controller. They act as typical crud queries and mutations.
@Resolver()
export class PostResolver {
  // The first is to add the @Query decorator, which marks the class method as a GraphQL query.
  // The second is to provide the return type. Since the method is async, the reflection metadata system
  // shows the return type as a Promise, so we have to add the decorator's parameter as returns => [Post]
  // to declare it resolves to an array of Post object types
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find();
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  async createPost(@Arg("title") title: string): Promise<Post> {
    // this saves using 2 sql queries
    // one to insert it and one to select it
    return Post.create({ title }).save();
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
