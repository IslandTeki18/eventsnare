import { ConvexReactClient } from 'convex/react';

const url = import.meta.env.VITE_CONVEX_URL;

if (!url) {
  throw new Error('Missing VITE_CONVEX_URL. Set it to the Convex .convex.cloud deployment URL.');
}

export const convex = new ConvexReactClient(url);
