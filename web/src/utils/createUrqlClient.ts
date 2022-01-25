import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import { pipe, tap } from "wonka"; //comes with urql
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import Router from "next/router";
import gql from "graphql-tag";
import { isServer } from "./isServer";

// Anytime there is an error in anything that is run, its gonna come here
const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error?.message.includes("not authenticated")) {
          Router.replace("/login");
        }
      })
    );
  };

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info; //Output: parentKey/entityKey is 'Query' and fieldName is 'posts'

    // will get all the fields in the cache that are under this Query
    // so if we are querying only 'posts', we will get details such as
    // ex: fieldKey: 'posts({"limit":10})', fieldName: 'posts', arguments: {limit: 10}
    // So if we had a bunch of data in our cache, (ex: we called 'posts' many times with different arguments)
    // it will all appear here
    const allFields = cache.inspectFields(entityKey);

    // filter out the queries that we dont care about (as there can be more on there that are not just posts, such as the 'me' query)
    // making sure that the fieldName is equal to 'posts'
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);

    const size = fieldInfos.length;
    if (size === 0) return undefined; // if no data, return undefined

    //? check if the data is in the cache, and return it from the cache

    //Output: after clicking load more btn, it will change 'posts({"limit":10})' to 'posts({"limit":10, "cursor:":"1762541762"})'
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    // check if the posts are in the cache or not
    const isItInTheCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    ); //Output: when you click load more btn, it will give null, so we need to request more data from the server
    // when we pass this, urql will think we did not give it all the data, so it will fetch more data from the server
    info.partial = !isItInTheCache;

    let hasMore = true;

    let results: string[] = [];
    // we may have many fieldInfos for posts, so loop through them all
    fieldInfos.forEach((fi) => {
      // reading data from the cache

      // First, we get the stringed key that identifies our Post
      const key = cache.resolve(entityKey, fi.fieldKey) as string; //Output will be something like Query.posts({"limit":10})
      // Then, we can use the key to get the field data from the entity
      const data = cache.resolve(key, "posts") as string[]; //Output will be an array of string Id's like [ 'Post:168', 'Post:106' ]
      const _hasMore = cache.resolve(key, "hasMore");
      // so we will loop through all of the cache, looping through all of the paginated queries that we have done
      // and if any of them has '_hasMore' as false, we are just gonna assign 'hasMore' as false
      // to say that there are no more data to get
      if (!_hasMore) hasMore = _hasMore as boolean;

      results.push(...data); //combine the pagination lists (combination of the first, second, etc. pages)
    });

    return {
      __typename: "PaginatedPosts", //required or it will not work
      hasMore,
      posts: results,
    }; // found data in the cache
  };
};

// The next-urql package includes setup for react-ssr-prepass already,
// which automates a lot of the complexity of setting up server-side
// rendering with urql
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  // ?? This is an extremely important part, as it will send the user cookies
  // ?? this means that on ssr, we can access req.session.userId
  // ?? this is used in side /post.ts/ in order to access the req.session.userId
  // ?? for the vote system to properly work
  // ?? works by send the cookies to the nextjs server, and the nextjs server
  // ?? is including them in the header, which is then send along to the graphql api
  let cookie = "";
  if (isServer()) {
    cookie = ctx.req.headers.cookie;
  }

  return {
    url: "http://localhost:5000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          // Its saying PaginatedPosts is a type we created, but we dont have an Id on that field
          // so we just have to say that there is no Id
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            // Client size resolvers that will run whenever the Query is run
            // we can alter how the query result looks
            // you can do this for computed values and add field resolvers on the client size too
            // so the name of this will match what we have when fetching posts, which is 'posts' insize our posts.graphql
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            createPost: (_result, args, cache, info) => {
              // ? Looping over all of the paginated items / queries that we could possibly call
              // ? and we invalidate all of them (essentially restart their cache?)
              // ?? for output, check out the comments inside cursorPagination with the below variable names
              const allFields = cache.inspectFields("Query");
              const fieldInfos = allFields.filter(
                (info) => info.fieldName === "posts"
              );
              // ? Loop to invalidate all (new) queries that will appear due to load more
              fieldInfos.forEach((fi) => {
                // console.log("start"); //used for testing
                // console.log(cache.inspectFields("Query")); //used for testing

                // ? when called, it will essentially update the cache
                // ? by invalidating the query and refetch it from the server
                // ? Invalidating a specific query
                // ?? fi.arguments -> {"limit": 15}
                cache.invalidate("Query", "posts", fi.arguments || {});
                // console.log(cache.inspectFields("Query")); //used for testing
                // console.log("end"); //used for testing
              });
            },
            // ?? we could have just done this to update the cache for the votes, but instead
            // ?? but he decided to do it another, way which includes reading and updating fragments
            // vote: (_result, args, cache, info) => {
            //   cache.invalidate("Query", "posts", { limit: 15 });
            // },
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;

              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                  }
                `,
                { id: postId } as any
              );
              console.log(data);
              if (data) {
                if (data.voteStatus === args.value) return;
                // ?? if we havent voted before, it should be a 1,
                // ?? but if we have voted, we are switching out vote, so a 2
                const newPoints =
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value } as any
                );
              }
            },
            logout: (_result, args, cache, info) => {
              // set the MeQuery value to null
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              );
            },

            // This is to update the cache whenever we login or register
            // specifically, we are updating the MeQuery and putting the user in it
            login: (_result, args, cache, info) => {
              // Original Method to do this
              // cache.updateQuery({ query: MeDocument }, (data) => {});

              // The reason for this is because using the original method
              // The typescript types are not good enough
              // so we created our own that has better logic for our needs
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
            },

            register: (_result, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};
