import type { DehydratedState } from "@tanstack/react-query";
import { AppFrame } from "@/app/AppFrame";
import { AppProviders } from "@/app/AppProviders";
import { BrowserRoutes } from "@/app/routes-client";
import { queryClient } from "./lib/queryClient";

interface AppProps {
  dehydratedState?: DehydratedState;
}

function App({ dehydratedState }: AppProps) {
  return (
    <AppProviders queryClient={queryClient} dehydratedState={dehydratedState}>
      <AppFrame Routes={BrowserRoutes} />
    </AppProviders>
  );
}

export default App;
