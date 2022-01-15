import { withUrqlClient } from "next-urql";
import { NavBar } from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <>
      <NavBar />
      <div>Hello World</div>
      <br />
      {!data ? (
        <div>loading</div>
      ) : (
        data.posts.map((p) => <div key={p.id}>{p.title}</div>)
      )}
    </>
  );
};

// sets up the urql provider to allow for server-side rendering
// with this set up, we can now easily toggle between having ssr or not
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
// watch around 3:55:00 onwards in the vid to understand not having ssr
// ssr provides good SEO

