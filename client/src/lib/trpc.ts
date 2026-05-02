import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api/_lib/routers";

export const trpc = createTRPCReact<AppRouter>();
