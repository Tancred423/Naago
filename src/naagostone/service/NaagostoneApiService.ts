import { Character, CharacterResponse } from "../type/CharacterTypes.ts";
import { ApiRequestFailedError } from "../error/ApiRequestFailedError.ts";
import { CharacterSearchResponse } from "../type/CharacterSearchTypes.ts";
import { Maintenance, MaintenanceResponse } from "../type/Maintenance.ts";
import { Notice, NoticeResponse } from "../type/Notice.ts";
import { Topic, TopicResponse } from "../type/Topic.ts";
import { Update, UpdateResponse } from "../type/Updates.ts";
import { Status, StatusResponse } from "../type/Status.ts";

const naagostoneHost = Deno.env.get("NAAGOSTONE_HOST")!;
const naagostonePort = Deno.env.get("NAAGOSTONE_PORT")!;

export class NaagostoneApiService {
  public static async fetchCharacterIdsByName(
    name: string,
    server: string,
  ): Promise<number[]> {
    const nameEncoded = encodeURIComponent(name);
    const response = await fetch(
      `http://${naagostoneHost}:${naagostonePort}/character/search?name=${nameEncoded}&worldname=${server}`,
    );

    if (!response.ok) {
      throw new ApiRequestFailedError(`Failed to get character ids by name: ${response.statusText}`);
    }

    const data = await response.json() as CharacterSearchResponse;
    return data.list.map((character) => character.id);
  }

  public static async fetchCharacterById(id: number): Promise<Character | null> {
    const response = await fetch(`http://${naagostoneHost}:${naagostonePort}/character/${id}`);

    if (!response.ok) {
      throw new ApiRequestFailedError(`Failed to get character by id: ${response.statusText}`);
    }

    const data = await response.json() as CharacterResponse;
    return data?.character ?? null;
  }

  public static async fetchLatest10Topics(): Promise<Topic[]> {
    const response = await fetch(`http://${naagostoneHost}:${naagostonePort}/lodestone/topics`);

    if (!response.ok) {
      throw new ApiRequestFailedError(`Failed to fetch latest 10 topics: ${response.statusText}`);
    }

    const data = await response.json() as TopicResponse;
    return data?.topics ?? [];
  }

  public static async fetchLatest10Notices(): Promise<Notice[]> {
    const response = await fetch(`http://${naagostoneHost}:${naagostonePort}/lodestone/notices`);

    if (!response.ok) {
      throw new ApiRequestFailedError(`Failed to fetch latest 10 notices: ${response.statusText}`);
    }

    const data = await response.json() as NoticeResponse;
    return data?.notices ?? [];
  }

  public static async fetchLatest10Maintenances(): Promise<Maintenance[]> {
    const response = await fetch(`http://${naagostoneHost}:${naagostonePort}/lodestone/maintenances`);

    if (!response.ok) {
      throw new ApiRequestFailedError(`Failed to fetch latest 10 maintenances: ${response.statusText}`);
    }

    const data = await response.json() as MaintenanceResponse;
    return data?.maintenances ?? [];
  }

  public static async fetchLatest10Updates(): Promise<Update[]> {
    const response = await fetch(`http://${naagostoneHost}:${naagostonePort}/lodestone/updates`);

    if (!response.ok) {
      throw new ApiRequestFailedError(`Failed to fetch latest 10 updates: ${response.statusText}`);
    }

    const data = await response.json() as UpdateResponse;
    return data?.updates ?? [];
  }

  public static async fetchLatest10Statuses(): Promise<Status[]> {
    const response = await fetch(`http://${naagostoneHost}:${naagostonePort}/lodestone/statuses`);

    if (!response.ok) {
      throw new ApiRequestFailedError(`Failed to fetch latest 10 statuses: ${response.statusText}`);
    }

    const data = await response.json() as StatusResponse;
    return data?.statuses ?? [];
  }
}
