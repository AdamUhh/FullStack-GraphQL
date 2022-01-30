import { Box, Button, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import {
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { useGetIntId } from "../../../utils/useGetIntId";
import { withApollo } from "../../../utils/withApollo";

const EditPost = ({}) => {
  const router = useRouter();
  const intId = useGetIntId();
  const { data, error, loading } = usePostQuery({
    // ?? if we have a -1, we know we have a bad url parameter,
    // ?? so dont bother sending a request to the server,
    // ?? just pause the query before it is run
    skip: intId === -1,
    variables: {
      id: intId,
    },
  });
  const [updatePost] = useUpdatePostMutation();

  if (loading)
    return (
      <Layout>
        <Box>Loading...</Box>
      </Layout>
    );

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
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          // ...values is the title and text
          await updatePost({ variables: { id: intId, ...values } });
          //   router.push("/");
          router.back(); // takes you back to where you were before you clicked the edit button
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="Title" label="Title" />
            <Box mt={4}>
              <InputField
                textarea
                name="text"
                placeholder="Text..."
                label="Body"
              />
            </Box>
            <Flex>
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                bgColor={"teal"}
              >
                Update Post
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

// export default withUrqlClient(createUrqlClient)(EditPost);
// export default EditPost;
export default withApollo({ssr: false})(EditPost);

