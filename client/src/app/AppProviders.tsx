import { HydrationBoundary, type DehydratedState, QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Router, type BaseLocationHook } from "wouter";
import { SeoProvider, type SeoManager } from "@/components/Seo";
import { CartProvider } from "@/context/CartContext";

interface AppProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
  dehydratedState?: DehydratedState;
  routerHook?: BaseLocationHook;
  seoManager?: SeoManager;
}

export function AppProviders({
  children,
  queryClient,
  dehydratedState,
  routerHook,
  seoManager,
}: AppProvidersProps) {
  const content = (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <CartProvider>
          <SeoProvider manager={seoManager}>{children}</SeoProvider>
        </CartProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );

  if (!routerHook) {
    return content;
  }

  return <Router hook={routerHook}>{content}</Router>;
}

