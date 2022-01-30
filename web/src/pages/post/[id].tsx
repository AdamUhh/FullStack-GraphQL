import { Box, Flex, Heading } from "@chakra-ui/react";
import React from "react";
import { EditDeletePostBtn } from "../../components/EditDeletePostBtn";
import { Layout } from "../../components/Layout";
import { useGetPostFromUrl } from "../../utils/useGetPostFromUrl";
import { withApollo } from "../../utils/withApollo";
interface PostProps {}

const Post: React.FC<PostProps> = ({}) => {
  const { data, error, loading } = useGetPostFromUrl();

  if (loading) {
    return (
      <Layout>
        <Box>Loading...</Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box>{error.message}</Box>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find post</Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Flex>
        <Heading mb={4}>{data.post.title}</Heading>
        <Box ml="auto">
          <EditDeletePostBtn
            id={data.post.id}
            creatorId={data.post.creator.id}
          />
        </Box>
      </Flex>
      {data.post.text}
    </Layout>
  );
};

// export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
// export default Post;
export default withApollo({ ssr: true })(Post);
