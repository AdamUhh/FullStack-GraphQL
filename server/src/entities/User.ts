import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
// Converting the class into an Object Type for /resolvers/post.ts/ to work
// By adding Fields(), you are displaying  it to the graphql schema
// This means that you will not be able to query for something that doesnt have a Field() above it
@ObjectType({ description: "The User Model" })
@Entity()
export class User extends BaseEntity{
  @Field()
  @PrimaryGeneratedColumn()
  id!: number; // the ! is not null

  // Standard fields (createdAt, updatedAt) that are good to have
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({ unique: true })
  username!: string; // the ! is not null

  @Field()
  @Column({ unique: true })
  email!: string; // the ! is not null

  // Since password doenst have Field(), you cannot query for it in graphql
  @Column()
  password!: string; // the ! is not null
}
