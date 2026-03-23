import { startServer } from "@ada/mcp-server";

export async function mcpCommand(): Promise<void> {
  await startServer();
}
