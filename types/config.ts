export interface Config {
  // Discord
  clientId: string;
  guildId: string;
  token: string;
  isProd: boolean;
  lodestoneCheckOnStart: boolean;
  checkCommandIds: boolean;

  // Database
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPass: string;
  dbDatabase: string;

  // Naagostone API
  naagostoneHost?: string;
  naagostonePort: number;
  saveLodestoneNews: boolean;
  sendLodestoneNews: boolean;

  // Twitter
  twitterApiKey: string;
  twitterApiKeySecret: string;
  twitterAccessToken: string;
  twitterAccessTokenSecret: string;
  twitterBearerToken: string;

  // UI Colors
  colorDiscord: string;
  colorSuccess: string;
  colorError: string;
  colorInfo: string;
  colorFFXIV: string;
  colorTwitter: string;

  // Icons
  topicIconLink: string;
  noticeIconLink: string;
  maintenanceIconLink: string;
  updateIconLink: string;
  statusIconLink: string;
  lodestoneIconLink: string;

  // FFXIV API
  ffxivApiBaseLink: string;

  // Game Data
  numDataCenters: number;
  numServers: number;
  numLanguages: number;
  maxAchievements: number;
}
