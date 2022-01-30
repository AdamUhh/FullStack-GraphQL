import { Box, Button, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../components/InputField";
import { Layout } from "../components/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import { useIsAuth } from "../utils/useIsAuth";
import { withApollo } from "../utils/withApollo";

const createPost: React.FC<{}> = ({}) => {
  const router = useRouter();
  useIsAuth();
  const [createPost] = useCreatePostMutation();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          const { errors } = await createPost({
            variables: { input: values },
            update: (cache) => {
              // we use fieldname if we want to evict a query (not a Post like others)
              cache.evict({ fieldName: "posts:{}" });
              // cache.evict({ fieldName: "posts" });
            },
          });
          // If there was an error, the global error handler
          // (inside web/src/utils/createUrqlClient.ts -> errorExchange) will handle it
          // And if not logged in. will redirect them to /login
          if (!errors) {
            router.push("/");
          }
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
                Create Post
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

// export default withUrqlClient(createUrqlClient)(createPost);
// export default createPost;
export default withApollo({ssr: false})(createPost);

