import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: "always",
    },
    mutations: {
      onError: (error) => {
        toast.error(error.message || "Something went wrong");
      },
    },
  },
});
