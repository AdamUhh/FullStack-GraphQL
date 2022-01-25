import { User } from "./User";
import { ObjectType, Field, Int } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Updoot } from "./Updoot";

//@info: Converting the class into an Object Type for /resolvers/post.ts/ to work
//@info: ObjectType() marks the class as the type known from the GraphQL SDL or 'GraphQLObjectType' from 'graphql-js'
@ObjectType({ description: "The Post Model" })
@Entity() //@info: This is not from graphql but an orm .Entities are simple javascript objects
//@info: BaseEntity for this case, allows us to do stuff like Post.find(), .insert(), etc
export class Post extends BaseEntity {
  //@info: By adding Field(), you are exposing it to the graphql sdl(schema definition language)
  //@info: This means that you will not be able to query for something that doesnt have a Field() above it
  @Field()
  @PrimaryGeneratedColumn() //@note: @PrimaryGeneratedColumn() is part of the 'TYPEORM' syntax
  id!: number; //@note: the ! mean it is not null

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  // this is essentially likes and dislikes
  @Field()
  @Column({ type: "int", default: 0 })
  points!: number;
  
  @Field(() => Int, { nullable: true })
  voteStatus: number | null; // 1 or -1 or null

  @Field()
  @Column()
  creatorId: number;

  // this will set up a foreign key to the Users table
  // we will store that foreign key in the creatorId
  // We are pointing it to the type we want to be connected to, in this case 'User'
  // We are then saying that inside this type, is a field called posts
  // Which is used to essentially say, these many posts belong to this one user
  @Field()
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[];

  // Standard fields such as 'createdAt and 'updatedAt' are good to have
  @Field(() => String)
  @CreateDateColumn() // is a database table and is part of the 'ORM' syntax
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
