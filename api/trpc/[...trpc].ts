import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/trpc";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert VercelRequest to a standard Request for tRPC fetch adapter
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = `${proto}://${host}${req.url}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = JSON.stringify(req.body);
  }

  const fetchReq = new Request(url, {
    method: req.method,
    headers,
    body,
  });

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: fetchReq,
    router: appRouter,
    createContext: () => createContext(req),
  });

  // Copy response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  res.status(response.status);
  const responseBody = await response.text();
  res.send(responseBody);
}
