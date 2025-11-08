import { Character, CharacterResponse } from "../type/CharacterTypes.ts";
import { ApiRequestFailedError } from "../error/ApiRequestFailedError.ts";
import { CharacterSearchResponse } from "../type/CharacterSearchTypes.ts";
import { Maintenance, MaintenanceResponse } from "../type/Maintenance.ts";
import { Notice, NoticeResponse } from "../type/Notice.ts";
import { Topic, TopicResponse } from "../type/Topic.ts";
import { Update, UpdateResponse } from "../type/Updates.ts";
import { Status, StatusResponse } from "../type/Status.ts";

const naagostoneHost = Deno.env.get("NAAGOSTONE_HOST") || "localhost";
const naagostonePort = Deno.env.get("NAAGOSTONE_PORT")!;

export class NaagostoneApiService {
  static async fetchCharacterIdsByName(
    name: string,
    server: string,
  ): Promise<number[]> {
    const nameEncoded = encodeURIComponent(name);
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/character/search?name=${nameEncoded}&worldname=${server}`,
    );

    if (!res.ok) {
      throw new ApiRequestFailedError(
        `Failed to get character ids by name: ${res.statusText}`,
      );
    }

    const data = await res.json() as CharacterSearchResponse;
    return data.list.map((character) => character.id);
  }

  static async fetchCharacterById(id: number): Promise<Character | null> {
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/character/${id}`,
    );

    if (!res.ok) {
      throw new ApiRequestFailedError(
        `Failed to get character by id: ${res.statusText}`,
      );
    }

    const data = await res.json() as CharacterResponse;
    return data?.character ?? null;
  }

  static async fetchLatest10Topics(): Promise<Topic[]> {
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/lodestone/topics`,
    );

    if (!res.ok) {
      throw new ApiRequestFailedError(
        `Failed to fetch latest 10 topics: ${res.statusText}`,
      );
    }

    const data = await res.json() as TopicResponse;
    return data?.topics ?? [];
  }

  static async fetchLatest10Notices(): Promise<Notice[]> {
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/lodestone/notices`,
    );

    if (!res.ok) {
      throw new ApiRequestFailedError(
        `Failed to fetch latest 10 notices: ${res.statusText}`,
      );
    }

    const data = await res.json() as NoticeResponse;
    return data?.notices ?? [];
  }

  static async fetchLatest10Maintenances(): Promise<Maintenance[]> {
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/lodestone/maintenances`,
    );

    if (!res.ok) {
      throw new ApiRequestFailedError(
        `Failed to fetch latest 10 maintenances: ${res.statusText}`,
      );
    }

    const data = await res.json() as MaintenanceResponse;
    return data?.maintenances ?? [];
  }

  static async fetchLatest10Updates(): Promise<Update[]> {
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/lodestone/updates`,
    );

    if (!res.ok) {
      throw new ApiRequestFailedError(
        `Failed to fetch latest 10 updates: ${res.statusText}`,
      );
    }

    const data = await res.json() as UpdateResponse;
    return data?.updates ?? [];
  }

  static async fetchLatest10Statuses(): Promise<Status[]> {
    const res = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/lodestone/statuses`,
    );

    if (!res.ok) {
      throw new ApiRequestFailedError(
        `Failed to fetch latest 10 statuses: ${res.statusText}`,
      );
    }

    const data = await res.json() as StatusResponse;
    return data?.statuses ?? [];
  }
}
