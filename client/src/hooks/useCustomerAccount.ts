import { useQuery, useQueryClient } from '@tanstack/react-query';
import { portalApi, PortalError, type CustomerAccount } from '@/lib/customer-portal';

const accountKey = ['customer-account'] as const;

/** Sesión del portal. Devuelve null si no hay cuenta abierta: eso no es un
 *  error, es el estado normal de quien todavía no ha entrado. */
export function useCustomerAccount() {
  return useQuery<CustomerAccount | null>({
    queryKey: accountKey,
    queryFn: async () => {
      try {
        return await portalApi.me();
      } catch (error) {
        if (error instanceof PortalError && (error.status === 401 || error.status === 404)) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useAccountSession() {
  const queryClient = useQueryClient();
  return {
    setAccount: (account: CustomerAccount | null) => queryClient.setQueryData(accountKey, account),
    refresh: () => queryClient.invalidateQueries({ queryKey: accountKey }),
  };
}
