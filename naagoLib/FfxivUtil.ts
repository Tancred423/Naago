import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Character, CharacterResponse } from "../dto/CharacterDto.ts";
import type { CharacterSearchResponse } from "../naagostone/types/CharacterSearchTypes.ts";

const naagostoneHost = Deno.env.get("NAAGOSTONE_HOST") || "localhost";
const naagostonePort = Deno.env.get("NAAGOSTONE_PORT")!;

export default class FfxivUtil {
  static formatName(name: string): string {
    const nameSplit = name.split(" ");
    if (nameSplit.length !== 2) return name;

    const firstName = nameSplit[0];
    const lastName = nameSplit[1];

    return `${firstName.substring(0, 1).toUpperCase()}${
      firstName
        .substring(1)
        .toLowerCase()
    } ${lastName.substring(0, 1).toUpperCase()}${
      lastName
        .substring(1)
        .toLowerCase()
    }`;
  }

  static isValidServer(server: string): boolean {
    const data = readFileSync("servers.txt");
    const servers = data.toString().split(",");
    return servers.includes(server.toLowerCase());
  }

  static async getCharacterIdsByName(
    name: string,
    server: string,
  ): Promise<number[]> {
    const nameEncoded = encodeURIComponent(name);
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/character/search?name=${nameEncoded}&worldname=${server}`,
    );
    if (!res.ok) return [];
    const data = await res.json() as CharacterSearchResponse;
    return data.list.map((character) => character.id);
  }

  static async getCharacterById(id: number): Promise<Character | null> {
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/character/${id}`,
    );
    if (!res.ok) return undefined;
    const data = await res.json() as CharacterResponse;
    return data?.character ?? null;
  }

  static generateVerificationCode(): string {
    return `naago-${randomBytes(3).toString("hex")}`;
  }
}
