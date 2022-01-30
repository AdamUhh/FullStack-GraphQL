import { Box, Button, Flex, Link } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { MeDocument, MeQuery, useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { withApollo } from "../utils/withApollo";
const Login: React.FC<{}> = ({}) => {
  const router = useRouter();
  // Accepts a single query argument of type string | DocumentNode
  // and returns a tuple of the shape [result, executeMutation]
  // result contains {fetching, error, and data}
  // The executeMutation function may be used to start executing a mutation
  // so when you submit, it goes to this register func which then runs the useMutation? something like that maybe?
  // Additionally, useRegisterMutation replaced useMutation at around 2:50:00 from the vid
  const [login] = useLoginMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const res = await login({
            variables: values,
            update: (cache, { data }) => {
              // we are getting the data, which is the result of the register
              // and we are sticking in the cache for the meQuery
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: "Query",
                  me: data?.login.user,
                },
              });
              cache.evict({ fieldName: "posts:{}" });
            },
          });
          if (res.data?.login.errors) {
            // The errors that we are getting back from graphql look like this
            // [{field: 'username', message: 'something wrong'}]
            setErrors(toErrorMap(res.data.login.errors));
          } else if (res.data?.login.user) {
            // successfully registered user

            // due to useIsAuth.ts, we have saved the initial link that the user clicked
            // but was redirected due to not being logged in
            // after logging in, the url path is then saved inside router.query.next due
            // to useIsAuth.ts saving the path using '"/login?next=" + router.pathname'
            // now, after logging in, we check if there is a path saved and if so, redirect there
            // else, redirect to home page
            if (typeof router.query.next === "string") {
              router.push(router.query.next);
            } else {
              router.push("/"); // push to home page
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameOrEmail"
              placeholder="Username Or Email"
              label="Username Or Email"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="Password"
                label="Password"
                type="password"
              />
            </Box>
            <Flex>
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                bgColor={"teal"}
              >
                Login
              </Button>
              <Box ml="auto" mt={4}>
                <NextLink href="/forgot-password">
                  <Link>Forgot Password?</Link>
                </NextLink>
              </Box>
            </Flex>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// export default Login;
// export default withUrqlClient(createUrqlClient)(Login);
// export default Login;
export default withApollo({ssr: false})(Login);
