import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

export const useIsAuth = () => {
  const { data, loading } = useMeQuery();
  const router = useRouter();

  useEffect(() => {
    // When we are not loading and when the user is not logged in
    // will automatically redirect to /login page
    if (!loading && !data?.me) {
      // By adding ?next=" + router.pathname
      // ex: when the user clicks /create-post and is not logged in,
      // he will be redirected to /login - after logging in, normally he will
      // be redirected to '/', but because of ?next=router.pathname
      // the initial path (/create-post) is saved (inside router.query.next)
      // which is then accessed inside src/pages/login.tsx and redirects
      // when logged in button is pressed
      router.replace("/login?next=" + router.pathname);
      //   router.replace("/login");
    }
  }, [loading, data, router]);
};
