import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { EditDeletePostBtn } from "../components/EditDeletePostBtn";
import { Layout } from "../components/Layout";
import { UpdootSection } from "../components/UpdootSection";
import { usePostsQuery } from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const Index = () => {
  const { data, error, loading, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 15,
      cursor: null as null | string,
    },
    notifyOnNetworkStatusChange: true,
  });

  // Note: 'fetching' is not affected and always returns false
  if (!data && !loading) {
    return (
      <div>
        <div>Failed Query:</div>
        <div>{error?.message}</div>
      </div>
    );
  }
  return (
    <Layout>
      {!data && loading ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) =>
            // If we have any null values, we return null
            // (without this condition, we will get a null p, which will break everything)
            !p ? null : (
              <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
                <Box>
                  <UpdootSection post={p} />
                </Box>
                <Box flex={1}>
                  <Flex alignItems={"center"} wordBreak={"break-all"}>
                    <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                      <Link>
                        <Heading fontSize="xl">{p.title}</Heading>
                      </Link>
                    </NextLink>
                    <Box ml="auto">
                      <EditDeletePostBtn id={p.id} creatorId={p.creator.id} />
                    </Box>
                  </Flex>
                  <Text>Posted By: {p.creator.username}</Text>
                  <Text mt={4}>{p.textSnippet}</Text>
                </Box>
              </Flex>
            )
          )}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            m="auto"
            my={8}
            isLoading={loading}
            onClick={() =>
              fetchMore({
                variables: {
                  limit: variables?.limit,
                  cursor:
                    data.posts.posts[data.posts.posts.length - 1].createdAt, // get all items after the last element in the list
                },
                // this is the old apollo method that uses updateQuery
                // go to __app.tsx for the new apollo method
                // updateQuery: (prevValue, { fetchMoreResult }): PostsQuery => {
                //   if (!fetchMoreResult) {
                //     return prevValue as PostsQuery;
                //   }

                // take the two results and turn them into a single post query
                // return {
                //   __typename: "Query",
                //   posts: {
                //     __typename: "PaginatedPosts",
                //     hasMore: (fetchMoreResult as PostsQuery).posts.hasMore,
                //     posts: [
                //       ...(prevValue as PostsQuery).posts.posts,
                //       ...(fetchMoreResult as PostsQuery).posts.posts,
                //     ],
                //   },
                // };
                // },
              })
            }
          >
            Load More
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

// ? sets up the urql provider to allow for server-side rendering
// ? with this set up, we can now easily toggle between having ssr or not
// export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
// ? watch around 3:55:00 onwards in the vid to understand not having ssr
// ? ssr provides good SEO
//
// ? no longer needed for apollo
export default withApollo({ ssr: true })(Index);
// export default Index;
