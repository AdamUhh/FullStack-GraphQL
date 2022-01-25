import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useState } from "react";
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { UpdootSection } from "../components/UpdootSection";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  // Note: 'fetching' is not affected and always returns false
  if (!data && !fetching) {
    return <div>No posts...</div>;
  }
  return (
    <Layout>
      <Flex align="center" padding={"0 10px"}>
        <Heading>LiReddit</Heading>
        <NextLink href="/create-post">
          <Link ml="auto">Create Post</Link>
        </NextLink>
      </Flex>
      <br />
      {!data && fetching ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
              <Box>
                <UpdootSection post={p} />
              </Box>
              <Box>
                <Heading fontSize="xl">{p.title}</Heading>
                <Text>Posted By: {p.creator.username}</Text>
                <Text mt={4}>{p.textSnippet}</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            m="auto"
            my={8}
            isLoading={fetching}
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt, // get all items after the last element in the list
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

// sets up the urql provider to allow for server-side rendering
// with this set up, we can now easily toggle between having ssr or not
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
// watch around 3:55:00 onwards in the vid to understand not having ssr
// ssr provides good SEO
