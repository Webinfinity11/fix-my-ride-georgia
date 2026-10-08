import { QueryClient } from "@tanstack/react-query";

// A single cache for React observers and imperative public metadata lookups.
export const queryClient = new QueryClient();
