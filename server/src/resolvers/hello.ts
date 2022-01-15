import { Resolver, Query } from 'type-graphql';

@Resolver()
export class HelloResolver {
    // () => String is what the Query returns
    @Query(() => String)
    hello() {
        return 'hello world';
    }
}
