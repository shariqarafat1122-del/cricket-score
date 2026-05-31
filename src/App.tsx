import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PlayerTrackerPage from "./components/PlayerTrackerPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PlayerTrackerPage />
    </QueryClientProvider>
  );
}
