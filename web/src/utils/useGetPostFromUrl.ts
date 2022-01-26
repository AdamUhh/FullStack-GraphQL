import { usePostQuery } from "../generated/graphql";
import { useGetIntId } from "./useGetIntId";

export const useGetPostFromUrl = () => {
  const intId = useGetIntId();
  return usePostQuery({
    // ?? if we have a -1, we know we have a bad url parameter,
    // ?? so dont bother sending a request to the server,
    // ?? just pause the query before it is run
    pause: intId === -1,
    variables: {
      id: intId,
    },
  });
};
