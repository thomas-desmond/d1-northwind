import {
  json,
  LoaderArgs,
  LoaderFunction,
  redirect,
} from "@remix-run/cloudflare";

export const createCheckoutLoader = (): LoaderFunction => {
  return async (args: LoaderArgs) => {
    return redirect(args.context.CHECKOUT_URL);
  };
};

// Usage
export const loader = createCheckoutLoader();
