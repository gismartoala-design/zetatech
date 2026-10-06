import { dehydrate, type DehydratedState, type QueryClient } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import type { BaseLocationHook } from "wouter";
import { AppFrame } from "@/app/AppFrame";
import { AppProviders } from "@/app/AppProviders";
import { ServerRoutes } from "@/app/routes-server";
import { createSeoManager, type SeoState } from "@/components/Seo";

// Wouter's memoryLocation uses useSyncExternalStore without getServerSnapshot,
// which breaks SSR. Use a plain static hook instead.
function createStaticLocationHook(path: string): BaseLocationHook {
  const hook: BaseLocationHook = () => [path, () => {}];
  return hook;
}

interface RenderAppOptions {
  path: string;
  queryClient: QueryClient;
}

export interface RenderAppResult {
  appHtml: string;
  dehydratedState: DehydratedState;
  seo: SeoState;
}

export function renderApp({ path, queryClient }: RenderAppOptions): RenderAppResult {
  const routerHook = createStaticLocationHook(path);
  const dehydratedState = dehydrate(queryClient);
  const seoManager = createSeoManager();

  const appHtml = renderToString(
    <AppProviders
      queryClient={queryClient}
      dehydratedState={dehydratedState}
      routerHook={routerHook}
      seoManager={seoManager}
    >
      <AppFrame Routes={ServerRoutes} fallback={null} />
    </AppProviders>,
  );

  return {
    appHtml,
    dehydratedState,
    seo: seoManager.getState(),
  };
}
