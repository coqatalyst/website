import { ConvexReactClient, ConvexProvider } from "convex/react";
import type { FunctionComponent } from "react";

const CONVEX_URL = import.meta.env.PUBLIC_CONVEX_URL;

const client = new ConvexReactClient(CONVEX_URL);

export function withConvexProvider<Props extends Record<string, any>>(
  Component: FunctionComponent<Props>,
) {
  function WithConvexProvider(props: Props) {
    return (
      <ConvexProvider client={client}>
        <Component {...props} />
      </ConvexProvider>
    );
  }
  WithConvexProvider.displayName = `WithConvexProvider(${Component.displayName || Component.name || "Component"})`;
  return WithConvexProvider as FunctionComponent<Props>;
}
