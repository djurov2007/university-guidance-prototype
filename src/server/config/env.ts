import "server-only";
import { parseServerConfig } from "./schema";

export function getServerConfig() {
  return parseServerConfig({ APP_MODE: process.env.APP_MODE });
}
