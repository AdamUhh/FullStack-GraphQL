import React, { useState } from "react";
import { Flex, IconButton } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {
  PostSnippetFragment,
  useVoteMutation,
  VoteMutation,
} from "../generated/graphql";
import { gql, ApolloCache } from "@apollo/client";

interface UpdootSectionProps {
  post: PostSnippetFragment;
}

const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const data = cache.readFragment<{
    id: number;
    points: number;
    voteStatus: number | null;
  }>({
    id: "Post:" + postId,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  });

  if (data) {
    let newPoints;
    // ? if the user voted before and wants to unvote
    //! note: added this part
    if (data.voteStatus === value) {
      newPoints = (data.points as number) + -1 * value;
    } else {
      // ?? if we havent voted before, it should be a 1,
      // ?? but if we have voted, we are switching out vote, so a 2
      newPoints = (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
    }
    cache.writeFragment({
      id: "Post:" + postId,
      fragment: gql`
        fragment __ on Post {
          points
          voteStatus
        }
      `,
      data: { points: newPoints, voteStatus: newPoints },
    });
  }
};

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  // this weird syntax is called a union - think of it like an interface?
  const [loadingState, setLoadingState] = useState<
    "updoot-loading" | "downdoot-loading" | "not-loading"
  >("not-loading");
  const [vote] = useVoteMutation();


  return (
    <Flex
      direction={"column"}
      justifyContent={"center"}
      alignItems={"center"}
      marginRight={4}
    >
      <IconButton
        onClick={async () => {
          // if (post.voteStatus === 1) {
          //   return;
          // }
          setLoadingState("updoot-loading");
          await vote({
            variables: { postId: post.id, value: 1 },
            update: (cache) => updateAfterVote(1, post.id, cache),
          });
          setLoadingState("not-loading");
        }}
        isLoading={loadingState === "updoot-loading"}
        bgColor={post.voteStatus === 1 ? "green" : undefined}
        aria-label="Upvote"
        icon={<ChevronUpIcon fontSize="24px" />}
      />
      {post.points}
      <IconButton
        onClick={async () => {
          // if (post.voteStatus === -1) {
          //   return;
          // }
          setLoadingState("downdoot-loading");
          await vote({
            variables: { postId: post.id, value: -1 },
            update: (cache) => updateAfterVote(-1, post.id, cache),
          });
          setLoadingState("not-loading");
        }}
        bgColor={post.voteStatus === -1 ? "red" : undefined}
        isLoading={loadingState === "downdoot-loading"}
        aria-label="Downvote"
        icon={<ChevronDownIcon fontSize="24px" />}
      />
    </Flex>
  );
};
