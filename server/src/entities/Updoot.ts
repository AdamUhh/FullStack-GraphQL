import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@Entity() 
export class Updoot extends BaseEntity {
  @Column({ type: "int" })
  value: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.updoots)
  user: User;

  @PrimaryColumn()
  postId: number;

  // when a post is deleted, we want to cascade (if used inside of /resolvers/post.ts/ -> deletePost())
  // @ManyToOne(() => Post, (post) => post.updoots, { onDelete: 'CASCADE' }) 
  @ManyToOne(() => Post, (post) => post.updoots) 
  post: Post;
}
