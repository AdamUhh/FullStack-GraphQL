import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

// Converting the class into an Object Type for /resolvers/post.ts/ to work
// By adding Fields(), you are displaying  it to the graphql schema
// This means that you will not be able to query for something that doesnt have a Field() above it
@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryKey()
  id!: number; // the ! is not null

  // Standard fields (createdAt, updatedAt) that are good to have
  // @Property is a database table
  @Field(() => String, { nullable: true })
  @Property({ type: "date" })
  createdAt!: Date;

  // Standard field that are good to have
  // The onUpdate hook will create a new date everytime we update
  @Field(() => String, { nullable: true })
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt!: Date;

  @Field()
  @Property({ type: "text", unique: true })
  username!: string; // the ! is not null
  
  @Field()
  @Property({ type: "text", unique: true })
  email!: string; // the ! is not null

  // Since password doenst have Field(), you cannot query for it in graphql
  @Property({ type: "text" })
  password!: string; // the ! is not null
}

// Previous entity using only username
// @Field()
// @PrimaryKey()
// id!: number; // the ! is not null

// // Standard fields (createdAt, updatedAt) that are good to have
// // @Property is a database table
// @Field(() => String, { nullable: true })
// @Property({ type: "date" })
// createdAt!: Date;

// // Standard field that are good to have
// // The onUpdate hook will create a new date everytime we update
// @Field(() => String, { nullable: true })
// @Property({ type: "date", onUpdate: () => new Date() })
// updatedAt!: Date;

// @Field()
// @Property({ type: "text", unique: true })
// username!: string; // the ! is not null

// // Since password doenst have Field(), you cannot query for it in graphql
// @Property({ type: "text" })
// password!: string; // the ! is not null
