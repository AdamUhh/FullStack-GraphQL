import { createWithApollo } from "./createWithApollo";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { PaginatedPosts } from "../generated/graphql";
import { NextPageContext } from "next";

const createClient = (ctx: NextPageContext | undefined) =>
  new ApolloClient({
    uri: process.env.NEXT_PUBLIC_API_URL as string,
    credentials: "include",
    headers: {
      cookie:
        (typeof window === "undefined" ? ctx?.req?.headers.cookie : undefined) ||
        "",
    },
    // note, in order to create ssr with apollo, we needed something called
    // next-apollo, but this module doesnt work with graphql@16+
    // so we just copied the src code and pasted it inside /utils/createWithApollo.tsx/
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            posts: {
              keyArgs: [], // idk how to explain this, pls check apollo docs
              merge(
                existing: PaginatedPosts | undefined,
                incoming: PaginatedPosts
              ) {
                //   ): PaginatedPosts {
                return {
                  // __typename: "PaginatedPosts",
                  // hasMore: incoming.hasMore,
                  ...incoming, //this is the equivalent of the comment above (__typename, hasMore)
                  posts: [...(existing?.posts || []), ...incoming.posts],
                };
              },
            },
          },
        },
      },
    }),
  });

export const withApollo = createWithApollo(createClient);
