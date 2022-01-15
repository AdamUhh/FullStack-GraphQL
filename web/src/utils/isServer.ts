export const isServer = () => typeof window === "undefined";
// if undefined, we are on the server (ssr)
// else, client
// Check out ../components/Navbar.tsx/ for explanation