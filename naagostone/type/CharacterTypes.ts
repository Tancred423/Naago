export interface Bio {
  html: string;
  markdown: string;
}

export interface Characteristics {
  race: string;
  tribe: string;
  gender: string;
}

export interface Server {
  world: string;
  dc: string;
}

export interface GuardianDeity {
  name: string;
  icon: string;
}

export interface Town {
  name: string;
  icon: string;
}

export interface ActiveClassJob {
  icon: string;
  name: string;
  level: number;
}

export interface GrandCompany {
  name: string;
  rank: string;
  icon: string;
}

export interface FreeCompany {
  id: number;
  name: string;
  icon_layer_0: string;
  icon_layer_1: string;
}

export interface ClassJob {
  icon: string;
  level: number;
  unlockstate: string;
  current_exp: string;
  max_exp: string;
}

export interface Bozja {
  level: number;
  mettle: string;
  name: string;
}

export interface Eureka {
  current_exp: string;
  max_exp: string;
  level: number;
  name: string;
}

export interface Equipment {
  name: string;
  icon: string;
  mirage_name?: string;
  mirage_icon?: string;
  rarity?: string;
  color_code?: string;
  color_name?: string;
  amount_dye_slots?: number;
  materia_1?: string;
  materia_1_stats?: string;
  materia_2?: string;
  materia_2_stats?: string;
  type?: string;
  item_level?: string;
}

export interface Character {
  id: number;
  bio: Bio;
  name: string;
  title: string;
  avatar: string;
  portrait: string;
  characteristics?: Characteristics;
  server: Server;
  nameday: string;
  guardian_deity: GuardianDeity;
  town: Town;
  started: number;
  ap: number;
  amount_achievements: number;
  amount_mounts: number;
  amount_minions: number;
  active_classjob: ActiveClassJob;
  grand_company?: GrandCompany;
  free_company?: FreeCompany;
  pvp_team?: string;
  strength: number;
  dexterity: number;
  vitality: number;
  intelligence: number;
  mind: number;
  critical_hit_rate: number;
  determination: number;
  direct_hit_rate: number;
  defense: number;
  magic_defense: number;
  attack_power: number;
  skill_speed: number;
  attack_magic_potency: number;
  healing_magic_potency: number;
  spell_speed: number;
  tenacity: number;
  piety: number;
  hp: number;
  mp_gp_cp: number;
  mp_gp_cp_parameter_name: string;
  bozja?: Bozja;
  eureka?: Eureka;
  paladin: ClassJob;
  warrior: ClassJob;
  darkknight: ClassJob;
  gunbreaker: ClassJob;
  whitemage: ClassJob;
  scholar: ClassJob;
  astrologian: ClassJob;
  sage: ClassJob;
  monk: ClassJob;
  dragoon: ClassJob;
  ninja: ClassJob;
  samurai: ClassJob;
  reaper: ClassJob;
  viper: ClassJob;
  bard: ClassJob;
  machinist: ClassJob;
  dancer: ClassJob;
  blackmage: ClassJob;
  summoner: ClassJob;
  redmage: ClassJob;
  pictomancer: ClassJob;
  bluemage: ClassJob;
  carpenter: ClassJob;
  blacksmith: ClassJob;
  armorer: ClassJob;
  goldsmith: ClassJob;
  leatherworker: ClassJob;
  weaver: ClassJob;
  alchemist: ClassJob;
  culinarian: ClassJob;
  miner: ClassJob;
  botanist: ClassJob;
  fisher: ClassJob;
  mainhand: Equipment | null;
  offhand: Equipment | null;
  head: Equipment | null;
  body: Equipment | null;
  hands: Equipment | null;
  legs: Equipment | null;
  feet: Equipment | null;
  earrings: Equipment | null;
  necklace: Equipment | null;
  bracelets: Equipment | null;
  ring1: Equipment | null;
  ring2: Equipment | null;
  soulcrystal: Equipment | null;
  facewear?: Equipment;
  item_level: string;
}

export interface CharacterResponse {
  character: Character;
}
