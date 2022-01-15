import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectType, Field } from 'type-graphql';

//? Converting the class into an Object Type for /resolvers/post.ts/ to work
//? ObjectType() marks the class as the type known from the GraphQL SDL or 'GraphQLObjectType' from 'graphql-js'
@ObjectType({ description: 'The Post Model' })
@Entity() // This is not from graphql but an orm .Entities are simple javascript objects
export class Post {
    //? By adding Field(), you are exposing it to the graphql sdl(schema definition language)
    //? This means that you will not be able to query for something that doesnt have a Field() above it
    @Field()
    @PrimaryKey() // @PrimaryKey() is part of the 'ORM' syntax
    id!: number; // the ! mean it is not null

    // Standard fields such as 'createdAt and 'updatedAt' are good to have
    @Field(() => String)
    @Property({ type: 'date' }) // @Property is a database table and is part of the 'ORM' syntax
    createdAt = new Date();

    @Field(() => String)
    @Property({ type: 'date', onUpdate: () => new Date() }) // The onUpdate hook will create a new date everytime we update
    updatedAt = new Date();

    @Field()
    @Property({ type: 'text' })
    title!: string; // the ! mean it is not null
}

// Inside the migration file, this output originally occured
// this.addSql('create table "post" ("id" serial primary key, "created_at" jsonb not null, "updated_at" jsonb not null, "title" varchar(255) not null);');
// "created_at" jsonb should be a date
// "updated_at" jsonb should be a date
// "title" varchar(255) should be a string
// By adding the type, we are changing it to
// this.addSql('create table "post" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null);');
