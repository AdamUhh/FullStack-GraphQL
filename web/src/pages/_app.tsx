import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app";
import theme from "../theme";



function MyApp({ Component, pageProps }: AppProps) {
  return (
    // <ApolloProvider client={client}>
      <ChakraProvider resetCSS theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    // </ApolloProvider>
  );
}

export default MyApp;
