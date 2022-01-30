import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { MeDocument, MeQuery, useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { withApollo } from "../utils/withApollo";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const router = useRouter();
  // Accepts a single query argument of type string | DocumentNode
  // and returns a tuple of the shape [result, executeMutation]
  // result contains {fetching, error, and data}
  // The executeMutation function may be used to start executing a mutation
  // so when you submit, it goes to this register func which then runs the useMutation? something like that maybe?
  // Additionally, useRegisterMutation replaced useMutation at around 2:50:00 from the vid
  const [register] = useRegisterMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "", username: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const res = await register({
            variables: { options: values },
            update: (cache, { data }) => {
              // we are getting the data, which is the result of the register
              // and we are sticking in the cache for the meQuery
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: "Query",
                  me: data?.register.user,
                },
              });
            },
          });
          if (res.data?.register.errors) {
            // The errors that we are getting back from graphql look like this
            // [{field: 'username', message: 'something wrong'}]
            setErrors(toErrorMap(res.data.register.errors));
          } else if (res.data?.register.user) {
            // successfully registered user
            router.push("/"); // push to home page
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="username"
              placeholder="Username"
              label="Username"
            />
            <Box mt={4}>
              <InputField name="email" placeholder="email" label="email" />
            </Box>
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="Password"
                label="Password"
                type="password"
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              bgColor={"teal"}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

// Now, anytime we want to access Urql, we gotta wrap it with withUrqlClient
// export default withUrqlClient(createUrqlClient)(Register);
// export default Register;
export default withApollo({ssr: false})(Register);

