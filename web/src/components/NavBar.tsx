import React, { useState, useEffect } from "react";
import { Heading, Box, Button, Flex, Link } from "@chakra-ui/react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useApolloClient } from "@apollo/client";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const router = useRouter();
  const [logout, { loading: logoutFetching }] = useLogoutMutation();
  const apolloClient = useApolloClient();
  // get the current user (inside data.me)
  const { data, loading } = useMeQuery({
    // when on ssr, 'skip' stops it from fetching the current user via 'isServer()'
    // by checking if the request/func was made from the server or client?
    // Because we have our Navbar in the Index.ts and we set ssr to true,
    // without 'skip', it is making an extra request (to useMeQuery) on the server (everytime a page is server-side rendered (Index.ts))
    // and the nextjs server does not have a cookie aswell, so it returns null
    // (because its not sending out a cookie so we are not getting a user)
    // therefore, we can use skip to stop it from fetching the current user (from the server specifically)
    // by checking if the window variable is defined (on the server, it is not defined)
    skip: isServer(),
    // @note: this is now pointless as we are getting the cookies from the 'vote' inside /utils/createUrqlClient.ts/
    // @note: however, he still decides to keep it, as he doesnt really feel like making an extra request to the server
    // @note: anyway, if he were to remove this, then all requests will be made/fetched on the server, and will not do it from the browser
  });

  // Let this code run in the browser
  // Read this for the explanation: https://github.com/vercel/next.js/discussions/17443#discussioncomment-87097
  // The post below it is the solution: https://github.com/vercel/next.js/discussions/17443#discussioncomment-637879
  // without this, I keep getting Warning: Expected server HTML to contain a matching <a> in <div>
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  let body = null;
  if (loading) {
    // data is loading
  } else if (!data?.me) {
    // user not logged in
    body = (
      <>
        <NextLink href={"/login"}>
          <Link mr={2}>Login</Link>
        </NextLink>
        <NextLink href={"/register"}>
          <Link>Register</Link>
        </NextLink>
      </>
    );
  } else {
    // user is logged in
    body = (
      <Flex alignItems={"center"}>
        <NextLink href="/create-post">
          <Button as={Link} mr={4}>
            Create Post
          </Button>
        </NextLink>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          variant="link"
          onClick={async () => {
            await logout();
            // refreshes everything without reloading the page
            apolloClient.resetStore();
            // router.reload();
          }}
          isLoading={logoutFetching}
        >
          Logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex zIndex={2} position="sticky" bg="#444" p={4} alignItems={"center"}>
      <Flex maxW={1000} alignItems={"center"} flex={1} m="auto">
        <NextLink href="/">
          <Link>
            <Heading>LiReddit</Heading>
          </Link>
        </NextLink>
        <Box ml={"auto"}>{mounted && body}</Box>
      </Flex>
    </Flex>
  );
};
