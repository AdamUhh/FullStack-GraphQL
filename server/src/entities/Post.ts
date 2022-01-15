import { ObjectType, Field } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from "typeorm";

//? Converting the class into an Object Type for /resolvers/post.ts/ to work
//? ObjectType() marks the class as the type known from the GraphQL SDL or 'GraphQLObjectType' from 'graphql-js'
@ObjectType({ description: "The Post Model" })
@Entity() // This is not from graphql but an orm .Entities are simple javascript objects
// BaseEntity for this case, allows us to do stuff like Post.find(), .insert(), etc
export class Post extends BaseEntity {
  //? By adding Field(), you are exposing it to the graphql sdl(schema definition language)
  //? This means that you will not be able to query for something that doesnt have a Field() above it
  @Field()
  @PrimaryGeneratedColumn() // @PrimaryGeneratedColumn() is part of the 'TYPEORM' syntax
  id!: number; // the ! mean it is not null

  // Standard fields such as 'createdAt and 'updatedAt' are good to have
  @Field(() => String)
  @CreateDateColumn() // is a database table and is part of the 'ORM' syntax
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column()
  title!: string; // the ! mean it is not null
}
