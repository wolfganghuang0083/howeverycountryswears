/**
 * Stub tRPC client for static deployment.
 * All tRPC calls will return empty/null data.
 * This prevents import errors while community features are disabled.
 */

// Create a proxy that returns no-op hooks for any procedure path
function createNoopProxy(): any {
  return new Proxy({} as any, {
    get(_target, prop) {
      if (prop === "useQuery") {
        return () => ({ data: null, isLoading: false, error: null, refetch: () => {} });
      }
      if (prop === "useMutation") {
        return () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
      }
      if (prop === "useUtils") {
        return () => new Proxy({}, { get: () => createNoopProxy() });
      }
      if (prop === "Provider") {
        return ({ children }: { children: any }) => children;
      }
      // Recursively return proxy for nested paths like trpc.auth.me.useQuery
      return createNoopProxy();
    },
  });
}

export const trpc = createNoopProxy();
