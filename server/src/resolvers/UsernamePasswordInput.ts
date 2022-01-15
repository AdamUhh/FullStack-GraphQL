import {
  Field,
  InputType
} from "type-graphql";


// Mostly used for @Mutation
@InputType()
export class UsernamePasswordInput {
  @Field()
  email: string;

  @Field()
  username: string;

  @Field()
  password: string;
}
