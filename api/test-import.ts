import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test 1: Can we import jose?
    const jose = await import("jose");
    
    // Test 2: Can we import cookie?
    const cookie = await import("cookie");
    
    // Test 3: Can we import from _lib?
    const { createContext } = await import("./_lib/trpc.js");
    
    // Test 4: Can we import db?
    const { getDb } = await import("./_lib/db.js");
    
    res.status(200).json({ 
      status: "ok",
      jose: !!jose,
      cookie: !!cookie,
      createContext: !!createContext,
      getDb: !!getDb,
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 5),
    });
  }
}
