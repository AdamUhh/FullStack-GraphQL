import React from "react";
import { Box, Button, Flex, Link } from "@chakra-ui/react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import NextLink from "next/link";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  // get the current user (inside data.me)
  const [{ data, fetching }] = useMeQuery({
    // when on ssr, pause stops it from fetching the current user by
    // checking if the request/func was made from the server or client?
    // Because we have our Navbar in the Index.ts and we set ssr to true
    // It is making an extra request (to useMeQuery) on the server (everytime a page is server-side rendered (Incex.ts))
    // and the nextjs server does not have a cookie aswell, so it returns null (because its not sending out a cookie so we are not getting a user)
    // therefore, we can use pause to stop it from fetching the current user (from the server specifically)
    // by checking if the window variable is defined (on the server, it is not defined)
    pause: isServer(),
  });

  let body = null;
  if (fetching) {
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
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          variant="link"
          onClick={() => logout()}
          isLoading={logoutFetching}
        >
          Logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex zIndex={2} position="sticky" bg="#444" p={4}>
        <NextLink href="/">
          <Link>Home</Link>
        </NextLink>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
