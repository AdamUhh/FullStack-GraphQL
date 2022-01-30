import { Box, IconButton } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";

interface EditDeletePostBtnProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostBtn: React.FC<EditDeletePostBtnProps> = ({
  id,
  creatorId,
}) => {
  const [deletePost] = useDeletePostMutation();
  const { data: meData } = useMeQuery();

  if (meData?.me?.id !== creatorId) return null;

  return (
    <Box ml="auto">
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton
          mr={2}
          // bgColor={"red"}
          aria-label="Delete Post"
          icon={<EditIcon />}
        />
      </NextLink>
      <IconButton
        ml="auto"
        // bgColor={"red"}
        aria-label="Delete Post"
        icon={<DeleteIcon />}
        onClick={() =>
          deletePost({
            variables: { id },
            update: (cache) => {
              // ex- Post:77 - this will remove it from the cache
              cache.evict({ id: "Post:" + id });
            },
          })
        }
      />
    </Box>
  );
};
