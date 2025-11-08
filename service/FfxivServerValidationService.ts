import { readFileSync } from "node:fs";

export class FfxivServerValidationService {
  static isValidServer(server: string): boolean {
    const data = readFileSync("servers.txt");
    const servers = data.toString().split(",");
    return servers.includes(server.toLowerCase());
  }
}
