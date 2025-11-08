import { Client, GuildEmoji } from "discord.js";

type EmoteName =
  | "github"
  | "instagram"
  | "reddit"
  | "spotify"
  | "steamcommunity"
  | "tiktok"
  | "twitch"
  | "youtube"
  | "twitter"
  | "loading"
  | "theme_dark"
  | "theme_light"
  | "theme_classic"
  | "theme_clear_blue"
  | "theme_final_days"
  | "theme_ultima_thule"
  | "theme_moon"
  | "theme_amaurot"
  | "theme_character_selection"
  | "maintenances"
  | "notices"
  | "status"
  | "topics"
  | "updates"
  | "doggo_smile";

export class DiscordEmoteService {
  static async get(
    client: Client,
    name: EmoteName,
  ): Promise<GuildEmoji | undefined> {
    const naagoEmoteServerId = "915541034220531772";
    const naagoEmoteServer = await client.guilds.fetch(naagoEmoteServerId);
    if (!naagoEmoteServer) return undefined;

    const emoteMap: Record<EmoteName, string> = {
      github: "921485435346251797",
      instagram: "921485626006700043",
      reddit: "921485728251260959",
      spotify: "921485793531408415",
      steamcommunity: "921485862506745857",
      tiktok: "921485973186031696",
      twitch: "915541076763365427",
      youtube: "915541076977254411",
      twitter: "915541076989861908",
      loading: "918998950885875762",
      theme_dark: "922677850543357982",
      theme_light: "922677850480467979",
      theme_classic: "922677850522390529",
      theme_clear_blue: "1063108616502120458",
      theme_final_days: "922681780606230629",
      theme_ultima_thule: "932065506343657502",
      theme_moon: "922718025654886400",
      theme_amaurot: "922699017337597952",
      theme_character_selection: "922709333639311422",
      maintenances: "922959045193793557",
      notices: "922959045256679444",
      status: "922959045378326578",
      topics: "922959045277650994",
      updates: "922959045466398770",
      doggo_smile: "924901318718521415",
    };

    const emoteId = emoteMap[name];
    if (!emoteId) return undefined;

    return await naagoEmoteServer.emojis.fetch(emoteId);
  }
}
