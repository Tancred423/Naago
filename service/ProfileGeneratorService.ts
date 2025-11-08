import { readFileSync } from "node:fs";
import { createCanvas, loadImage } from "canvas";
import { ActionRowBuilder, ButtonBuilder } from "discord.js";
import {
  BaseInteraction,
  ButtonInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
} from "discord.js";
import moment from "moment";
import { Buffer } from "node:buffer";
import { Character } from "../naagostone/type/CharacterTypes.ts";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";
import * as log from "@std/log";

const width = parseInt(Deno.env.get("PROFILE_WIDTH")!, 10);
const height = parseInt(Deno.env.get("PROFILE_HEIGHT")!, 10);
const borderRadius = parseInt(Deno.env.get("PROFILE_BORDER_RADIUS")!, 10);
const borderRadiusOuter = parseInt(
  Deno.env.get("PROFILE_BORDER_RADIUS_OUTER")!,
  10,
);
const maxLevel = parseInt(Deno.env.get("MAX_LEVEL")!, 10);
const maxLevelLimited = parseInt(Deno.env.get("MAX_LEVEL_LIMITED")!, 10);
const maxMounts = parseInt(Deno.env.get("MAX_MOUNTS")!, 10);
const maxMinions = parseInt(Deno.env.get("MAX_MINIONS")!, 10);
const maxAchievements = parseInt(Deno.env.get("MAX_ACHIEVEMENTS")!, 10);

type InteractionType =
  | CommandInteraction
  | ButtonInteraction
  | ContextMenuCommandInteraction;
type ProfilePage =
  | "profile"
  | "classesjobs"
  | "equipment"
  | "attributes"
  | "portrait";
type SubProfilePage = "dowdom" | "dohdol" | null;

interface Theme {
  [key: string]: any;
}

export class ProfileGeneratorService {
  static async getImage(
    interaction: BaseInteraction,
    character: Character,
    isVerified: boolean,
    profilePage: ProfilePage,
    subProfilePage: SubProfilePage = null,
  ): Promise<Buffer | string> {
    const profile = new Profile(interaction, character, isVerified);

    if (profilePage === "profile") return await profile.getProfile();
    else if (profilePage === "classesjobs") {
      if (subProfilePage === "dohdol") return await profile.getDohDol();
      else return await profile.getDowDom();
    } else if (profilePage === "equipment") return await profile.getEquipment();
    else if (profilePage === "attributes") return await profile.getAttributes();
    else if (profilePage === "portrait") return character.portrait;

    return character.portrait;
  }

  static getComponents(
    profilePage: ProfilePage,
    subProfilePage: SubProfilePage,
    commandName: string,
    characterId: number,
  ): ActionRowBuilder<ButtonBuilder>[] {
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Profile")
          .setCustomId(`${commandName}.profile.${characterId}`)
          .setStyle(profilePage === "profile" ? 1 : 2),
        new ButtonBuilder()
          .setLabel("Classes/Jobs")
          .setCustomId(`${commandName}.classesjobs.${characterId}`)
          .setStyle(profilePage === "classesjobs" ? 1 : 2),
        new ButtonBuilder()
          .setLabel("Equipment")
          .setCustomId(`${commandName}.equipment.${characterId}`)
          .setStyle(profilePage === "equipment" ? 1 : 2),
        new ButtonBuilder()
          .setLabel("Attributes")
          .setCustomId(`${commandName}.attributes.${characterId}`)
          .setStyle(profilePage === "attributes" ? 1 : 2),
        new ButtonBuilder()
          .setLabel("Portrait")
          .setCustomId(`${commandName}.portrait.${characterId}`)
          .setStyle(profilePage === "portrait" ? 1 : 2),
      ),
    );

    if (subProfilePage) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("DoW/DoM")
            .setCustomId(`${commandName}.dowdom.${characterId}`)
            .setStyle(subProfilePage === "dowdom" ? 1 : 2),
          new ButtonBuilder()
            .setLabel("DoH/DoL")
            .setCustomId(`${commandName}.dohdol.${characterId}`)
            .setStyle(subProfilePage === "dohdol" ? 1 : 2),
        ),
      );
    }

    return components;
  }
}

class Profile {
  private character: any;
  private isVerified: boolean;
  private userId: string;

  constructor(
    interaction: BaseInteraction,
    character: any,
    isVerified: boolean,
  ) {
    this.character = character;
    this.isVerified = isVerified;
    this.userId = interaction.user.id;
  }

  async getTheme(): Promise<Theme> {
    const themeName = await ThemeRepository.get(this.userId);
    const themeFile = readFileSync(`./theme/${themeName}.json`, "utf-8");
    return JSON.parse(themeFile);
  }

  async getProfile(): Promise<Buffer> {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme();

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    if (theme.background.startsWith("#")) {
      ctx.fillStyle = theme.background;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
    } else {
      ctx.save();
      ctx.lineWidth = 0;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();
      ctx.clip();
      const backgroundImage = await loadImage(theme.background);
      ctx.drawImage(backgroundImage, 0, 0);
      ctx.fillStyle = theme.background_transparency;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
      ctx.restore();
    }

    // Background border
    ctx.strokeStyle = theme.background_border;
    ctx.lineWidth = 3;
    ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = "Character";
    ctx.fillStyle = theme.window_title;
    ctx.font = `normal 20px roboto condensed`;
    ctx.fillText(windowTitle, 10, 8, width / 2);

    // Window title name
    const windowTitleName = this.character.name.toUpperCase();
    ctx.fillStyle = theme.window_title_name;
    ctx.textAlign = "right";
    ctx.font = `normal 20px romanus`;
    ctx.fillText(windowTitleName, width - 10, 8, width / 2);
    ctx.textAlign = "left";

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline;
    ctx.lineWidth = 2;
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke();

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`;
    ctx.fillStyle = theme.acj_level;
    ctx.font = `normal 20px MiedingerMediumW00-Regular`;
    ctx.fillText(acjLevel, 446, 50, 330);

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon);
    ctx.drawImage(acjIcon, 446, 75, 50, 50);

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name);
    ctx.drawImage(acjName, 446 + 50, 75);

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage(
        "./image/naago_verified.png",
      );
      ctx.drawImage(verificationSticker, 800 - 50 - 10, 35, 50, 50);
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save();
    ctx.strokeStyle = theme.portrait_border;
    ctx.lineWidth = 4;
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke();
    ctx.clip();

    // Portrait
    const portrait = await loadImage(this.character.portrait);
    ctx.drawImage(portrait, 450, 135, 330, 450);

    // Item level icon
    const gearIcon = await loadImage("./image/gear.png");
    ctx.drawImage(gearIcon, 690, 142);

    // Item level
    ctx.fillStyle = theme.item_level;
    ctx.font = `normal 30px roboto condensed`;
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50);
    ctx.textAlign = "left";

    ctx.restore();

    ////////////////////////////////////////////
    // Name and Title
    ////////////////////////////////////////////

    // Title
    ctx.textAlign = "center";
    if (this.character.title) {
      ctx.fillStyle = theme.title;
      ctx.font = `normal 35px myriad pro`;
      ctx.fillText(`< ${this.character.title} >`, 450 / 2, 100, 410);
    }

    // Name
    ctx.fillStyle = theme.name;
    ctx.font = `normal 60px myriad pro`;
    ctx.fillText(
      this.character.name,
      450 / 2,
      40 + (this.character.title ? 0 : 20),
      410,
    );
    ctx.textAlign = "left";

    ////////////////////////////////////////////
    // Character Info
    ////////////////////////////////////////////
    const yAdd = 97;

    const profileBlock = new ProfileBlock(theme, ctx, yAdd);
    await profileBlock.add(
      "World",
      `${this.character.server.world} (${this.character.server.dc})`,
      null,
      true,
    );
    await profileBlock.add(
      "Started",
      this.character.started === "Private"
        ? "Private"
        : moment(this.character.started * 1000).format("Do MMM Y"),
    );
    await profileBlock.add(
      "City-state",
      this.character.town.name,
      this.character.town.icon,
      false,
      true,
    );
    await profileBlock.add(
      "Characteristics",
      `${this.character.characteristics.race} (${this.character.characteristics.tribe})`,
      this.character.characteristics.gender == "♀"
        ? theme["emoji_female"]
        : theme["emoji_male"],
      true,
    );
    await profileBlock.add("Nameday", this.character.nameday, null, true);
    await profileBlock.add(
      `Grand Company: ${this.character.grand_company?.name ?? "-"}`,
      this.character.grand_company?.rank ?? "-",
      this.character.grand_company?.icon,
      true,
    );
    await profileBlock.add(
      "Free Company",
      this.character.free_company?.name ?? "-",
      [
        this.character.free_company?.icon_layer_0,
        this.character.free_company?.icon_layer_1,
        this.character.free_company?.icon_layer_2,
      ],
      true,
    );
    await profileBlock.add(
      "Guardian",
      this.character.guardian_deity.name,
      this.character.guardian_deity.icon,
      true,
    );
    await profileBlock.add(
      "Achievements",
      this.character.amount_achievements === "Private"
        ? "Private"
        : `${
          Math.round(
            (this.character.amount_achievements / maxAchievements) * 100,
          )
        } % (${this.character.ap} AP)`,
      "./image/achievements.png",
      false,
      false,
      true,
      1,
    );
    ctx.textAlign = "center";
    await profileBlock.add(
      "Mounts",
      this.character.amount_mounts
        ? `${Math.round((this.character.amount_mounts / maxMounts) * 100)} %`
        : "0 %",
      null,
      false,
      true,
      true,
      2,
    );
    await profileBlock.add(
      "Minions",
      this.character.amount_minions
        ? `${Math.round((this.character.amount_minions / maxMinions) * 100)} %`
        : "0 %",
      null,
      false,
      true,
      true,
      3,
    );
    ctx.textAlign = "left";

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer("image/png");
  }

  async getDowDom(): Promise<Buffer> {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme();

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    if (theme.background.startsWith("#")) {
      ctx.fillStyle = theme.background;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
    } else {
      ctx.save();
      ctx.lineWidth = 0;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();
      ctx.clip();
      const backgroundImage = await loadImage(theme.background);
      ctx.drawImage(backgroundImage, 0, 0);
      ctx.fillStyle = theme.background_transparency;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
      ctx.restore();
    }

    // Background border
    ctx.strokeStyle = theme.background_border;
    ctx.lineWidth = 3;
    ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = "Character";
    ctx.fillStyle = theme.window_title;
    ctx.font = `normal 20px roboto condensed`;
    ctx.fillText(windowTitle, 10, 8, width / 2);

    // Window title name
    const windowTitleName = this.character.name.toUpperCase();
    ctx.fillStyle = theme.window_title_name;
    ctx.textAlign = "right";
    ctx.font = `normal 20px romanus`;
    ctx.fillText(windowTitleName, width - 10, 8, width / 2);
    ctx.textAlign = "left";

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline;
    ctx.lineWidth = 2;
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke();

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`;
    ctx.fillStyle = theme.acj_level;
    ctx.font = `normal 20px MiedingerMediumW00-Regular`;
    ctx.fillText(acjLevel, 446, 50, 330);

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon);
    ctx.drawImage(acjIcon, 446, 75, 50, 50);

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name);
    ctx.drawImage(acjName, 446 + 50, 75);

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage(
        "./image/naago_verified.png",
      );
      ctx.drawImage(verificationSticker, 800 - 50 - 10, 35, 50, 50);
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save();
    ctx.strokeStyle = theme.portrait_border;
    ctx.lineWidth = 4;
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke();
    ctx.clip();

    // Portrait
    const portrait = await loadImage(this.character.portrait);
    ctx.drawImage(portrait, 450, 135, 330, 450);

    // Item level icon
    const gearIcon = await loadImage("./image/gear.png");
    ctx.drawImage(gearIcon, 690, 142);

    // Item level
    ctx.fillStyle = theme.item_level;
    ctx.font = `normal 30px roboto condensed`;
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50);
    ctx.textAlign = "left";

    ctx.restore();

    ////////////////////////////////////////////
    // Tank
    ////////////////////////////////////////////
    const fWidth = 410;
    let yAdd = 40;
    let x = 10;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 195, borderRadius).fill();

    const tankIcon = await loadImage("./image/tank.png");
    ctx.drawImage(tankIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Tank", x + 35, yAdd + 8);

    // Classes / Jobs
    yAdd -= 30;
    let classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd);
    await classJobBlock.add(this.character.paladin);
    await classJobBlock.add(this.character.warrior);
    await classJobBlock.add(this.character.darkknight);
    await classJobBlock.add(this.character.gunbreaker);

    ////////////////////////////////////////////
    // Healer
    ////////////////////////////////////////////
    yAdd = 237;
    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 195, borderRadius).fill();

    const healerIcon = await loadImage("./image/healer.png");
    ctx.drawImage(healerIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Healer", x + 35, yAdd + 8);

    // Classes / Jobs
    yAdd -= 30;
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd);
    await classJobBlock.add(this.character.whitemage);
    await classJobBlock.add(this.character.scholar);
    await classJobBlock.add(this.character.astrologian);
    await classJobBlock.add(this.character.sage);

    ////////////////////////////////////////////
    // Ranged DPS
    ////////////////////////////////////////////
    yAdd = 434;
    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 155, borderRadius).fill();

    const rangedIcon = await loadImage("./image/dps_ranged.png");
    ctx.drawImage(rangedIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Ranged DPS", x + 35, yAdd + 8);

    // Classes / Jobs
    yAdd -= 30;
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd);
    await classJobBlock.add(this.character.bard);
    await classJobBlock.add(this.character.machinist);
    await classJobBlock.add(this.character.dancer);

    ////////////////////////////////////////////
    // Melee DPS
    ////////////////////////////////////////////
    x = 225;
    yAdd = 40;
    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 275, borderRadius).fill();

    const meleeIcon = await loadImage("./image/dps_melee.png");
    ctx.drawImage(meleeIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Melee DPS", x + 35, yAdd + 8);

    // Classes / Jobs
    yAdd -= 30;
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd);
    await classJobBlock.add(this.character.monk);
    await classJobBlock.add(this.character.dragoon);
    await classJobBlock.add(this.character.ninja);
    await classJobBlock.add(this.character.samurai);
    await classJobBlock.add(this.character.reaper);
    await classJobBlock.add(this.character.viper);

    ////////////////////////////////////////////
    // Magical DPS
    ////////////////////////////////////////////
    yAdd = 317;
    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 193 + 40, borderRadius).fill();

    const magicIcon = await loadImage("./image/dps_magic.png");
    ctx.drawImage(magicIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Magical DPS", x + 35, yAdd + 8);

    // Classes / Jobs
    yAdd -= 30;
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd);
    await classJobBlock.add(this.character.blackmage);
    await classJobBlock.add(this.character.summoner);
    await classJobBlock.add(this.character.redmage);
    await classJobBlock.add(this.character.pictomancer);
    await classJobBlock.add(this.character.bluemage);

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer("image/png");
  }

  async getDohDol(): Promise<Buffer> {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme();

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    if (theme.background.startsWith("#")) {
      ctx.fillStyle = theme.background;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
    } else {
      ctx.save();
      ctx.lineWidth = 0;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();
      ctx.clip();
      const backgroundImage = await loadImage(theme.background);
      ctx.drawImage(backgroundImage, 0, 0);
      ctx.fillStyle = theme.background_transparency;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
      ctx.restore();
    }

    // Background border
    ctx.strokeStyle = theme.background_border;
    ctx.lineWidth = 3;
    ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = "Character";
    ctx.fillStyle = theme.window_title;
    ctx.font = `normal 20px roboto condensed`;
    ctx.fillText(windowTitle, 10, 8, width / 2);

    // Window title name
    const windowTitleName = this.character.name.toUpperCase();
    ctx.fillStyle = theme.window_title_name;
    ctx.textAlign = "right";
    ctx.font = `normal 20px romanus`;
    ctx.fillText(windowTitleName, width - 10, 8, width / 2);
    ctx.textAlign = "left";

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline;
    ctx.lineWidth = 2;
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke();

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`;
    ctx.fillStyle = theme.acj_level;
    ctx.font = `normal 20px MiedingerMediumW00-Regular`;
    ctx.fillText(acjLevel, 446, 50, 330);

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon);
    ctx.drawImage(acjIcon, 446, 75, 50, 50);

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name);
    ctx.drawImage(acjName, 446 + 50, 75);

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage(
        "./image/naago_verified.png",
      );
      ctx.drawImage(verificationSticker, 800 - 50 - 10, 35, 50, 50);
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save();
    ctx.strokeStyle = theme.portrait_border;
    ctx.lineWidth = 4;
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke();
    ctx.clip();

    // Portrait
    const portrait = await loadImage(this.character.portrait);
    ctx.drawImage(portrait, 450, 135, 330, 450);

    // Item level icon
    const gearIcon = await loadImage("./image/gear.png");
    ctx.drawImage(gearIcon, 690, 142);

    // Item level
    ctx.fillStyle = theme.item_level;
    ctx.font = `normal 30px roboto condensed`;
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50);
    ctx.textAlign = "left";

    ctx.restore();

    ////////////////////////////////////////////
    // DoH
    ////////////////////////////////////////////
    const fWidth = 410;
    let yAdd = 40;
    let x = 10;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 355, borderRadius).fill();

    const dohIcon = await loadImage("./image/doh.png");
    ctx.drawImage(dohIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Disciplines of the Hand", x + 35, yAdd + 8);

    // Classes / Jobs
    yAdd -= 30;
    let classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd);
    await classJobBlock.add(this.character.carpenter);
    await classJobBlock.add(this.character.blacksmith);
    await classJobBlock.add(this.character.armorer);
    await classJobBlock.add(this.character.goldsmith);
    await classJobBlock.add(this.character.leatherworker);
    await classJobBlock.add(this.character.weaver);
    await classJobBlock.add(this.character.alchemist);
    await classJobBlock.add(this.character.culinarian);

    ////////////////////////////////////////////
    // DoL
    ////////////////////////////////////////////
    x = 225;
    yAdd = 40;
    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 155, borderRadius).fill();

    const dolIcon = await loadImage("./image/dol.png");
    ctx.drawImage(dolIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Disciplines of the Land", x + 35, yAdd + 8);

    // Classes / Jobs
    yAdd -= 30;
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd);
    await classJobBlock.add(this.character.miner);
    await classJobBlock.add(this.character.botanist);
    await classJobBlock.add(this.character.fisher);

    ////////////////////////////////////////////
    // Bozja
    ////////////////////////////////////////////
    yAdd = 462;
    x = 10;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth + 10, 60, borderRadius).fill();

    const bozjaIcon = await loadImage("./image/bozja.png");
    ctx.drawImage(bozjaIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Bozja", x + 35, yAdd + 8);

    const bozja = this.character.bozja;
    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 20px roboto condensed`;
    ctx.fillText(
      bozja
        ? `${bozja.name}: ${bozja.level}` +
          (bozja.Mettle !== "--" ? ` (${bozja.Mettle} mettle)` : "")
        : "-",
      x + 10,
      yAdd + 30,
      fWidth - 10,
    );

    ////////////////////////////////////////////
    // Eureka
    ////////////////////////////////////////////
    yAdd = 527;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth + 10, 60, borderRadius).fill();

    const eurekaIcon = await loadImage("./image/eureka.png");
    ctx.drawImage(eurekaIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Eureka", x + 35, yAdd + 8);

    const eureka = this.character.eureka;
    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 20px roboto condensed`;
    ctx.fillText(
      eureka
        ? `${eureka.name}: ${eureka.level}` +
          (eureka.CurrentEXP !== "--"
            ? ` (${eureka.CurrentEXP} / ${eureka.MaxEXP} exp)`
            : "")
        : "-",
      x + 10,
      yAdd + 30,
      fWidth - 10,
    );

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer("image/png");
  }

  async getEquipment(): Promise<Buffer> {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme();

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    if (theme.background.startsWith("#")) {
      ctx.fillStyle = theme.background;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
    } else {
      ctx.save();
      ctx.lineWidth = 0;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();
      ctx.clip();
      const backgroundImage = await loadImage(theme.background);
      ctx.drawImage(backgroundImage, 0, 0);
      ctx.fillStyle = theme.background_transparency;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
      ctx.restore();
    }

    // Background border
    ctx.strokeStyle = theme.background_border;
    ctx.lineWidth = 3;
    ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = "Character";
    ctx.fillStyle = theme.window_title;
    ctx.font = `normal 20px roboto condensed`;
    ctx.fillText(windowTitle, 10, 8, width / 2);

    // Window title name
    const windowTitleName = this.character.name.toUpperCase();
    ctx.fillStyle = theme.window_title_name;
    ctx.textAlign = "right";
    ctx.font = `normal 20px romanus`;
    ctx.fillText(windowTitleName, width - 10, 8, width / 2);
    ctx.textAlign = "left";

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline;
    ctx.lineWidth = 2;
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke();

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`;
    ctx.fillStyle = theme.acj_level;
    ctx.font = `normal 16px MiedingerMediumW00-Regular`;
    ctx.fillText(acjLevel, 300, 70, 330);

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon);
    ctx.drawImage(acjIcon, 300, 93, 30, 30);

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name);
    ctx.drawImage(acjName, 300 + 30, 93, 280, 30);

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage(
        "./image/naago_verified.png",
      );
      ctx.drawImage(verificationSticker, 500 - 50, 40, 50, 50);
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save();
    ctx.strokeStyle = theme.portrait_border;
    ctx.lineWidth = 4;
    ctx.roundRect(300, 137, 200, 450, borderRadius).stroke();
    ctx.clip();

    // Portrait
    const portrait = await loadImage(this.character.portrait);
    ctx.drawImage(portrait, 235, 137, 330, 450);

    // Item level icon
    const gearIcon = await loadImage("./image/gear.png");
    ctx.drawImage(gearIcon, 500 - 80, 144);

    // Item level
    ctx.fillStyle = theme.item_level;
    ctx.font = `normal 30px roboto condensed`;
    ctx.fillText(this.character.item_level, 500 - 50, 142, 50);
    ctx.textAlign = "left";

    ctx.restore();

    ////////////////////////////////////////////
    // Gear
    ////////////////////////////////////////////
    const y = 45;
    let gear = new Gear(theme, ctx, 300, y, true);
    await gear.add(this.character.mainhand, "weapon", true);
    await gear.add(this.character.head, "head");
    await gear.add(this.character.body, "body");
    await gear.add(this.character.hands, "hands");
    await gear.add(this.character.legs, "legs");
    await gear.add(this.character.feet, "feet");

    gear = new Gear(theme, ctx, 500, y, false);
    await gear.add(this.character.offhand, "weapon", true);
    await gear.add(this.character.earrings, "earrings");
    await gear.add(this.character.necklace, "necklace");
    await gear.add(this.character.bracelets, "bracelets");
    await gear.add(this.character.ring1, "ring");
    await gear.add(this.character.ring2, "ring");
    await gear.add(this.character.facewear, "facewear");
    await gear.add(this.character.soulcrystal, "soulcrystal");

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer("image/png");
  }

  async getAttributes(): Promise<Buffer> {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme();

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    if (theme.background.startsWith("#")) {
      ctx.fillStyle = theme.background;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
    } else {
      ctx.save();
      ctx.lineWidth = 0;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();
      ctx.clip();
      const backgroundImage = await loadImage(theme.background);
      ctx.drawImage(backgroundImage, 0, 0);
      ctx.fillStyle = theme.background_transparency;
      ctx.roundRect(0, 0, width, height, borderRadiusOuter).fill();
      ctx.restore();
    }

    // Background border
    ctx.strokeStyle = theme.background_border;
    ctx.lineWidth = 3;
    ctx.roundRect(0, 0, width, height, borderRadiusOuter).stroke();

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = "Character";
    ctx.fillStyle = theme.window_title;
    ctx.font = `normal 20px roboto condensed`;
    ctx.fillText(windowTitle, 10, 8, width / 2);

    // Window title name
    const windowTitleName = this.character.name.toUpperCase();
    ctx.fillStyle = theme.window_title_name;
    ctx.textAlign = "right";
    ctx.font = `normal 20px romanus`;
    ctx.fillText(windowTitleName, width - 10, 8, width / 2);
    ctx.textAlign = "left";

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline;
    ctx.lineWidth = 2;
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke();

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`;
    ctx.fillStyle = theme.acj_level;
    ctx.font = `normal 20px MiedingerMediumW00-Regular`;
    ctx.fillText(acjLevel, 446, 50, 330);

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon);
    ctx.drawImage(acjIcon, 446, 75, 50, 50);

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name);
    ctx.drawImage(acjName, 446 + 50, 75);

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage(
        "./image/naago_verified.png",
      );
      ctx.drawImage(verificationSticker, 800 - 50 - 10, 35, 50, 50);
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save();
    ctx.strokeStyle = theme.portrait_border;
    ctx.lineWidth = 4;
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke();
    ctx.clip();

    // Portrait
    const portrait = await loadImage(this.character.portrait);
    ctx.drawImage(portrait, 450, 135, 330, 450);

    // Item level icon
    const gearIcon = await loadImage("./image/gear.png");
    ctx.drawImage(gearIcon, 690, 142);

    // Item level
    ctx.fillStyle = theme.item_level;
    ctx.font = `normal 30px roboto condensed`;
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50);
    ctx.textAlign = "left";

    ctx.restore();

    ////////////////////////////////////////////
    // HP MP
    ////////////////////////////////////////////
    const fWidth = 410;
    let yAdd = 50;
    let x = 10;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth + 10, 100, borderRadius).fill();

    ctx.textAlign = "left";
    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 16px MiedingerMediumW00-Regular`;
    ctx.fillText("HP", x + 20, yAdd + 40);

    ctx.textAlign = "right";
    ctx.fillStyle = theme.block_content_highlight;
    ctx.font = `normal 32px roboto condensed`;
    ctx.fillText(this.character.hp, 195, yAdd + 25);

    ctx.fillStyle = theme.green;
    ctx.roundRect(x + 20, yAdd + 60, 165, 7, 0).fill();

    ctx.textAlign = "left";
    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 16px MiedingerMediumW00-Regular`;
    ctx.fillText(
      this.character.mp_gp_cp_parameter_name,
      fWidth / 2 + 40,
      yAdd + 40,
    );

    ctx.textAlign = "right";
    ctx.fillStyle = theme.block_content_highlight;
    ctx.font = `normal 32px roboto condensed`;
    ctx.fillText(this.character.mp_gp_cp, fWidth, yAdd + 25);

    ctx.fillStyle = theme.purple;
    ctx.roundRect(fWidth / 2 + 40, yAdd + 60, 165, 7, 0).fill();

    ////////////////////////////////////////////
    // Attributes
    ////////////////////////////////////////////
    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;
    yAdd = 160;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth + 10, 100, borderRadius).fill();

    const attrIcon = await loadImage("./image/attributes.png");
    ctx.drawImage(attrIcon, x + 10, yAdd + 8, 20, 20);

    ctx.textAlign = "left";
    ctx.fillStyle = theme.block_content;
    ctx.fillText("Attributes", x + 35, yAdd + 8);

    // Stats left
    let stats = new Stats(theme, ctx, x, yAdd, fWidth);
    stats.add("Strength", this.character.strength, theme.green);
    stats.add("Dexterity", this.character.dexterity, theme.green);
    stats.add("Vitality", this.character.vitality, theme.green);

    // Stats right
    x = 225;
    stats = new Stats(theme, ctx, x, yAdd, fWidth);
    stats.add("Intelligence", this.character.intelligence, theme.purple);
    stats.add("Mind", this.character.mind, theme.purple);

    ////////////////////////////////////////////
    // Offensive Properties
    ////////////////////////////////////////////
    ctx.textAlign = "left";
    x = 10;
    yAdd = 269;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill();

    const offPropIcon = await loadImage("./image/offensive_properties.png");
    ctx.drawImage(offPropIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Offensive Properties", x + 35, yAdd + 8);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth);
    stats.add("Critical Hit", this.character.critical_hit_rate);
    stats.add("Determination", this.character.determination);
    stats.add("Direct Hit Rate", this.character.direct_hit_rate);

    ////////////////////////////////////////////
    // Defensive Properties
    ////////////////////////////////////////////
    ctx.textAlign = "left";
    x = 225;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill();

    const defPropIcon = await loadImage("./image/defensive_properties.png");
    ctx.drawImage(defPropIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Defensive Properties", x + 35, yAdd + 8);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth);
    stats.add("Defense", this.character.defense);
    stats.add("Magic Defense", this.character.magic_defense);

    ////////////////////////////////////////////
    // Physical Properties
    ////////////////////////////////////////////
    ctx.textAlign = "left";
    x = 10;
    yAdd = 378;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill();

    const physPropIcon = await loadImage("./image/physical_properties.png");
    ctx.drawImage(physPropIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Physical Properties", x + 35, yAdd + 8);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth);
    stats.add("Attack Power", this.character.attack_power);
    stats.add("Skill Speed", this.character.skill_speed);

    ////////////////////////////////////////////
    // Mental Properties
    ////////////////////////////////////////////
    ctx.textAlign = "left";
    x = 225;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill();

    const mentalPropIcon = await loadImage("./image/mental_properties.png");
    ctx.drawImage(mentalPropIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Mental Properties", x + 35, yAdd + 8);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth);
    stats.add("Attack Magic Potency", this.character.attack_magic_potency);
    stats.add("Healing Magic Potency", this.character.healing_magic_potency);
    stats.add("Spell Speed", this.character.spell_speed);

    ////////////////////////////////////////////
    // Gear
    ////////////////////////////////////////////
    ctx.textAlign = "left";
    x = 10;
    yAdd = 487;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill();

    const gIcon = await loadImage("./image/gear.png");
    ctx.drawImage(gIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Gear", x + 35, yAdd + 8);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth);
    stats.add("Average Item Level", this.character.item_level);

    ////////////////////////////////////////////
    // Role
    ////////////////////////////////////////////
    ctx.textAlign = "left";
    x = 225;

    ctx.fillStyle = theme.block_background;
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill();

    const roleIcon = await loadImage("./image/role.png");
    ctx.drawImage(roleIcon, x + 10, yAdd + 8, 20, 20);

    ctx.fillStyle = theme.block_content;
    ctx.font = `normal 16px roboto condensed`;
    ctx.fillText("Role", x + 35, yAdd + 8);

    ctx.fillStyle = theme.block_title;
    ctx.font = `normal 16px roboto condensed`;

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth);
    stats.add("Tenacity", this.character.tenacity);
    stats.add("Piety", this.character.piety);

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer("image/png");
  }
}

class ProfileBlock {
  private theme: Theme;
  private ctx: any;
  private yAdd: number;

  constructor(theme: Theme, ctx: any, yAdd: number) {
    this.theme = theme;
    this.ctx = ctx;
    this.yAdd = yAdd;
  }

  async add(
    title: string,
    content: string,
    iconLink: string | string[] | null = null,
    fullWidth = false,
    rightSide = false,
    triple = false,
    slot: number | null = null,
  ): Promise<void> {
    let x = rightSide ? 230 : 20;
    if (triple && slot === 2) x = 265;
    if (triple && slot === 3) x = 350;

    let fWidth = fullWidth ? 410 : 410 / 2 - 5;
    if (triple && slot === 1) fWidth = 240;
    if (triple && (slot === 2 || slot === 3)) fWidth = 80;
    if (!rightSide) this.yAdd += 55;

    const maxWidth = iconLink ? fWidth - 60 : fWidth - 20;

    this.ctx.fillStyle = this.theme.block_background;
    this.ctx.roundRect(x, this.yAdd, fWidth, 50, borderRadius).fill();

    this.ctx.fillStyle = this.theme.block_title;
    this.ctx.font = `normal 16px roboto condensed`;
    this.ctx.fillText(
      title,
      x + 10 + (triple && slot! > 1 ? 30 : 0),
      this.yAdd + 3,
      maxWidth,
    );

    this.ctx.fillStyle = this.theme.block_content;
    this.ctx.font = `bold 24px arial`;
    this.ctx.fillText(
      content,
      x + 10 + (triple && slot! > 1 ? 30 : 0),
      this.yAdd + 18,
      maxWidth,
    );

    if (iconLink instanceof Array) {
      for (const link of iconLink) {
        if (link) await this.drawIcon(link, fWidth, rightSide);
      }
    } else if (iconLink) await this.drawIcon(iconLink, fWidth, rightSide);
  }

  async drawIcon(
    iconLink: string,
    fWidth: number,
    rightSide: boolean,
  ): Promise<void> {
    try {
      const icon = await loadImage(iconLink);
      this.ctx.drawImage(
        icon,
        fWidth - 32 / 2 - 5 + (rightSide ? fWidth + 10 : 0),
        this.yAdd + 10,
        32,
        32,
      );
    } catch (err) {
      log.error(err);
    }
  }
}

class ClassJobBlock {
  private theme: Theme;
  private ctx: any;
  private x: number;
  private yAdd: number;

  constructor(theme: Theme, ctx: any, x: number, yAdd: number) {
    this.theme = theme;
    this.ctx = ctx;
    this.x = x;
    this.yAdd = yAdd;
  }

  async add(job: any): Promise<void> {
    this.yAdd += 40;

    const jobIcon = await loadImage(job.icon);
    this.ctx.drawImage(jobIcon, this.x + 10, this.yAdd + 25, 30, 30);

    const localMaxLevel = job.unlockstate === "Blue Mage"
      ? maxLevelLimited
      : maxLevel;

    this.ctx.textAlign = "right";
    this.ctx.fillStyle = job.level === localMaxLevel
      ? this.theme.block_content_highlight
      : this.theme.block_content;
    this.ctx.font = `bold 30px arial`;
    this.ctx.fillText(job.level, this.x + 90, this.yAdd + 23);
    this.ctx.textAlign = "left";

    this.ctx.fillStyle = this.theme.block_content;
    this.ctx.font = `bold 16px arial`;
    this.ctx.fillText(job.unlockstate, this.x + 92, this.yAdd + 27);

    this.ctx.fillStyle = this.theme.exp_bar;
    this.ctx.roundRect(this.x + 92, this.yAdd + 47, 100, 5, borderRadius)
      .fill();

    this.ctx.fillStyle = this.theme.exp_bar_filled;
    this.ctx
      .roundRect(
        this.x + 92,
        this.yAdd + 47,
        this.getLevelPercent(job),
        5,
        borderRadius,
      )
      .fill();
  }

  getLevelPercent(job: any): number {
    const currentExpParse = job.CurrentEXP.toString().replaceAll(",", "");
    const currentExp = isNaN(Number(currentExpParse))
      ? 0
      : parseInt(currentExpParse);

    const maxExpParse = job.MaxEXP.toString().replaceAll(",", "");
    const maxExp = isNaN(Number(maxExpParse)) ? 0 : parseInt(maxExpParse);

    if (maxExp === 0) return 0;
    else return Math.round((currentExp / maxExp) * 100);
  }
}

class Stats {
  private theme: Theme;
  private ctx: any;
  private x: number;
  private yAdd: number;
  private fWidth: number;

  constructor(theme: Theme, ctx: any, x: number, yAdd: number, fWidth: number) {
    this.theme = theme;
    this.ctx = ctx;
    this.x = x;
    this.yAdd = yAdd - 10;
    this.fWidth = fWidth;
  }

  add(
    title: string,
    content: string | number,
    color: string = this.theme.block_title,
  ): void {
    this.yAdd += 20;

    this.ctx.fillStyle = color;
    this.ctx.textAlign = "left";
    this.ctx.fillText(title, this.x + 10, this.yAdd + 23, 140);

    this.ctx.fillStyle = this.theme.block_title;
    this.ctx.textAlign = "right";
    this.ctx.fillText(
      content ?? "0",
      this.x > 200 ? this.fWidth : this.fWidth / 2,
      this.yAdd + 23,
    );
  }
}

class Gear {
  private theme: Theme;
  private ctx: any;
  private x: number;
  private y: number;
  private isLeft: boolean;
  private fWidth: number;
  private width: number;
  private height: number;

  constructor(theme: Theme, ctx: any, x: number, y: number, isLeft: boolean) {
    this.theme = theme;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.isLeft = isLeft;
    this.fWidth = 280 - 45;
    this.width = 290;
    this.height = 87;
  }

  async add(gear: any, type: string, isFirst = false): Promise<void> {
    if (!isFirst) this.y += 92;

    if (this.isLeft) this.ctx.textAlign = "right";
    else this.ctx.textAlign = "left";

    // BG
    this.ctx.fillStyle = this.theme.block_background;
    this.ctx
      .roundRect(
        this.isLeft ? 5 : this.x + 5,
        this.y,
        this.width,
        this.isLeft || isFirst
          ? this.height
          : type === "facewear" || type === "soulcrystal"
          ? this.height - 57
          : this.height - 15,
        borderRadius,
      )
      .fill();

    this.x = this.isLeft ? this.x - 10 : this.x + 10;
    this.y += 3;

    // Gear icon
    const gearIcon = await loadImage(
      gear ? gear.icon : this.getDefaultIcon(type),
    );
    this.ctx.drawImage(
      gearIcon,
      this.isLeft ? this.x - 35 : this.x + 5,
      type === "facewear" || type === "soulcrystal" ? this.y - 3 : this.y,
      30,
      30,
    );

    if (!gear) {
      this.x = this.isLeft ? this.x + 10 : this.x - 10;
      this.y -= this.isLeft ? 4 : type === "facewear" ? 59 : 4;

      return;
    }

    // Item level
    if (type !== "facewear" && type !== "soulcrystal") {
      this.ctx.font = `normal 18px roboto condensed`;
      this.ctx.fillStyle = this.theme.block_title;
      this.ctx.fillText(
        gear.item_level,
        this.isLeft ? this.x - 45 : this.x + 45,
        this.y,
        30,
      );
    }

    // Materia
    if (gear.materia_1) {
      const materiaIcon = await loadImage(this.getMateriaIcon(gear.materia_1));
      this.ctx.drawImage(
        materiaIcon,
        this.isLeft ? this.x - 80 - 20 : this.x + 80,
        this.y,
        16,
        16,
      );
    }

    if (gear.materia_2) {
      const materiaIcon = await loadImage(this.getMateriaIcon(gear.materia_2));
      this.ctx.drawImage(
        materiaIcon,
        this.isLeft ? this.x - 80 - 20 - 20 : this.x + 80 + 20,
        this.y,
        16,
        16,
      );
    }

    if (gear.materia_3) {
      const materiaIcon = await loadImage(this.getMateriaIcon(gear.materia_3));
      this.ctx.drawImage(
        materiaIcon,
        this.isLeft ? this.x - 80 - 20 - 20 * 2 : this.x + 80 + 20 * 2,
        this.y,
        16,
        16,
      );
    }

    if (gear.materia_4) {
      const materiaIcon = await loadImage(this.getMateriaIcon(gear.materia_4));
      this.ctx.drawImage(
        materiaIcon,
        this.isLeft ? this.x - 80 - 20 - 20 * 3 : this.x + 80 + 20 * 3,
        this.y,
        16,
        16,
      );
    }

    if (gear.materia_5) {
      const materiaIcon = await loadImage(this.getMateriaIcon(gear.materia_5));
      this.ctx.drawImage(
        materiaIcon,
        this.isLeft ? this.x - 80 - 20 - 20 * 4 : this.x + 80 + 20 * 4,
        this.y,
        16,
        16,
      );
    }

    // Item name
    this.ctx.font = `bold 15px roboto condensed`;
    this.ctx.fillStyle = gear.rarity
      ? this.theme[gear.rarity] ?? this.theme.block_content
      : this.theme.block_content;
    this.ctx.fillText(
      gear.name?.split("<")[0],
      this.isLeft ? this.x - 45 : this.x + 45,
      type === "facewear" || type === "soulcrystal" ? this.y + 3 : this.y + 17,
      this.fWidth,
    );

    // Mirage name
    if (gear.mirage_name) {
      const glamourIcon = await loadImage("./image/glamour.png");
      this.ctx.drawImage(
        glamourIcon,
        this.isLeft ? this.x - 62 : this.x + 45,
        this.y + 33,
        16,
        16,
      );

      this.ctx.font = `normal 14px roboto condensed`;
      this.ctx.fillStyle = this.theme.block_content;
      this.ctx.fillText(
        gear.mirage_name,
        this.isLeft ? this.x - 45 - 18 - 2 : this.x + 45 + 18 + 2,
        this.y + 35,
        this.fWidth - 19,
      );
    }

    // Mirage icon
    if (gear.mirage_icon) {
      const mirageIcon = await loadImage(gear.mirage_icon);
      this.ctx.drawImage(
        mirageIcon,
        this.isLeft ? this.x - 35 : this.x + 5,
        this.y + 35,
        30,
        30,
      );
    }

    if (this.isLeft && !isFirst) {
      if (gear.amount_dye_slots > 0) {
        // Color name
        if (!gear.color_name) gear.color_name = "Undyed";
        if (!gear.color_code) gear.color_code = "#00000000";

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.theme.mirage_border_color;
        this.ctx
          .roundRect(
            this.isLeft ? this.x - 45 - 12 - 3 : this.x + 45 + 3,
            this.y + 51,
            12,
            12,
            0.5,
          )
          .stroke();

        this.ctx.fillStyle = gear.color_code;
        this.ctx
          .roundRect(
            this.isLeft ? this.x - 45 - 12 - 2 : this.x + 45 + 2,
            this.y + 52,
            10,
            10,
            0.5,
          )
          .fill();

        this.ctx.font = `normal 14px roboto condensed`;
        this.ctx.fillStyle = this.theme.block_content;
        this.ctx.fillText(
          gear.color_name,
          this.isLeft ? this.x - 45 - 18 - 2 : this.x + 45 + 18 + 2,
          this.y + 50,
          this.fWidth - 19,
        );
      }

      if (gear.amount_dye_slots > 1) {
        // Color name 2
        if (!gear.color_name2) gear.color_name2 = "Undyed";
        if (!gear.color_code2) gear.color_code2 = "#00000000";

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.theme.mirage_border_color;
        this.ctx
          .roundRect(
            this.isLeft ? this.x - 45 - 12 - 3 : this.x + 45 + 3,
            this.y + 68,
            12,
            12,
            0.5,
          )
          .stroke();

        this.ctx.fillStyle = gear.color_code2;
        this.ctx
          .roundRect(
            this.isLeft ? this.x - 45 - 12 - 3 : this.x + 45 + 3,
            this.y + 68,
            12,
            12,
            0.5,
          )
          .fill();

        this.ctx.font = `normal 14px roboto condensed`;
        this.ctx.fillStyle = this.theme.block_content;
        this.ctx.fillText(
          gear.color_name2,
          this.isLeft ? this.x - 45 - 18 - 2 : this.x + 45 + 18 + 2,
          this.y + 67,
          this.fWidth - 19,
        );
      }
    }

    this.x = this.isLeft ? this.x + 10 : this.x - 10;
    this.y -= this.isLeft || isFirst ? 4 : type === "facewear" ? 52 : 18;
  }

  getDefaultIcon(type: string): string {
    switch (type) {
      case "head":
        return this.theme["no_head"];
      case "body":
        return this.theme["no_body"];
      case "hands":
        return this.theme["no_hands"];
      case "legs":
        return this.theme["no_legs"];
      case "feet":
        return this.theme["no_feet"];
      case "earrings":
        return this.theme["no_earrings"];
      case "necklace":
        return this.theme["no_necklace"];
      case "bracelets":
        return this.theme["no_bracelets"];
      case "ring":
        return this.theme["no_ring"];
      case "facewear":
        return this.theme["no_facewear"];
      case "soulcrystal":
        return this.theme["no_soulcrystal"];
      default:
        return this.theme["no_weapon"];
    }
  }

  getMateriaIcon(materia: string): string {
    switch (materia) {
      case "Savage Aim Materia I":
        return "./image/materia/crt_1.png";
      case "Savage Aim Materia II":
        return "./image/materia/crt_2.png";
      case "Savage Aim Materia III":
        return "./image/materia/crt_3.png";
      case "Savage Aim Materia IV":
        return "./image/materia/crt_4.png";
      case "Savage Aim Materia V":
        return "./image/materia/crt_5.png";
      case "Savage Aim Materia VI":
        return "./image/materia/crt_6.png";
      case "Savage Aim Materia VII":
        return "./image/materia/crt_7.png";
      case "Savage Aim Materia VIII":
        return "./image/materia/crt_8.png";
      case "Savage Aim Materia IX":
        return "./image/materia/crt_9.png";
      case "Savage Aim Materia X":
        return "./image/materia/crt_10.png";
      case "Savage Aim Materia XI":
        return "./image/materia/crt_11.png";
      case "Savage Aim Materia XII":
        return "./image/materia/crt_12.png";
      case "Heavens' Eye Materia I":
        return "./image/materia/dh_1.png";
      case "Heavens' Eye Materia II":
        return "./image/materia/dh_2.png";
      case "Heavens' Eye Materia III":
        return "./image/materia/dh_3.png";
      case "Heavens' Eye Materia IV":
        return "./image/materia/dh_4.png";
      case "Heavens' Eye Materia V":
        return "./image/materia/dh_5.png";
      case "Heavens' Eye Materia VI":
        return "./image/materia/dh_6.png";
      case "Heavens' Eye Materia VII":
        return "./image/materia/dh_7.png";
      case "Heavens' Eye Materia VIII":
        return "./image/materia/dh_8.png";
      case "Heavens' Eye Materia IX":
        return "./image/materia/dh_9.png";
      case "Heavens' Eye Materia X":
        return "./image/materia/dh_10.png";
      case "Heavens' Eye Materia XI":
        return "./image/materia/dh_11.png";
      case "Heavens' Eye Materia XII":
        return "./image/materia/dh_12.png";
      case "Savage Might Materia I":
        return "./image/materia/det_1.png";
      case "Savage Might Materia II":
        return "./image/materia/det_2.png";
      case "Savage Might Materia III":
        return "./image/materia/det_3.png";
      case "Savage Might Materia IV":
        return "./image/materia/det_4.png";
      case "Savage Might Materia V":
        return "./image/materia/det_5.png";
      case "Savage Might Materia VI":
        return "./image/materia/det_6.png";
      case "Savage Might Materia VII":
        return "./image/materia/det_7.png";
      case "Savage Might Materia VIII":
        return "./image/materia/det_8.png";
      case "Savage Might Materia IX":
        return "./image/materia/det_9.png";
      case "Savage Might Materia X":
        return "./image/materia/det_10.png";
      case "Savage Might Materia XI":
        return "./image/materia/det_11.png";
      case "Savage Might Materia XII":
        return "./image/materia/det_12.png";
      case "Quickarm Materia I":
        return "./image/materia/sks_1.png";
      case "Quickarm Materia II":
        return "./image/materia/sks_2.png";
      case "Quickarm Materia III":
        return "./image/materia/sks_3.png";
      case "Quickarm Materia IV":
        return "./image/materia/sks_4.png";
      case "Quickarm Materia V":
        return "./image/materia/sks_5.png";
      case "Quickarm Materia VI":
        return "./image/materia/sks_6.png";
      case "Quickarm Materia VII":
        return "./image/materia/sks_7.png";
      case "Quickarm Materia VIII":
        return "./image/materia/sks_8.png";
      case "Quickarm Materia IX":
        return "./image/materia/sks_9.png";
      case "Quickarm Materia X":
        return "./image/materia/sks_10.png";
      case "Quickarm Materia XI":
        return "./image/materia/sks_11.png";
      case "Quickarm Materia XII":
        return "./image/materia/sks_12.png";
      case "Quicktongue Materia I":
        return "./image/materia/sps_1.png";
      case "Quicktongue Materia II":
        return "./image/materia/sps_2.png";
      case "Quicktongue Materia III":
        return "./image/materia/sps_3.png";
      case "Quicktongue Materia IV":
        return "./image/materia/sps_4.png";
      case "Quicktongue Materia V":
        return "./image/materia/sps_5.png";
      case "Quicktongue Materia VI":
        return "./image/materia/sps_6.png";
      case "Quicktongue Materia VII":
        return "./image/materia/sps_7.png";
      case "Quicktongue Materia VIII":
        return "./image/materia/sps_8.png";
      case "Quicktongue Materia IX":
        return "./image/materia/sps_9.png";
      case "Quicktongue Materia X":
        return "./image/materia/sps_10.png";
      case "Quicktongue Materia XI":
        return "./image/materia/sps_11.png";
      case "Quicktongue Materia XII":
        return "./image/materia/sps_12.png";
      case "Battledance Materia I":
        return "./image/materia/tenacity_1.png";
      case "Battledance Materia II":
        return "./image/materia/tenacity_2.png";
      case "Battledance Materia III":
        return "./image/materia/tenacity_3.png";
      case "Battledance Materia IV":
        return "./image/materia/tenacity_4.png";
      case "Battledance Materia V":
        return "./image/materia/tenacity_5.png";
      case "Battledance Materia VI":
        return "./image/materia/tenacity_6.png";
      case "Battledance Materia VII":
        return "./image/materia/tenacity_7.png";
      case "Battledance Materia VIII":
        return "./image/materia/tenacity_8.png";
      case "Battledance Materia IX":
        return "./image/materia/tenacity_9.png";
      case "Battledance Materia X":
        return "./image/materia/tenacity_10.png";
      case "Battledance Materia XI":
        return "./image/materia/tenacity_11.png";
      case "Battledance Materia XII":
        return "./image/materia/tenacity_12.png";
      case "Piety Materia I":
        return "./image/materia/piety_1.png";
      case "Piety Materia II":
        return "./image/materia/piety_2.png";
      case "Piety Materia III":
        return "./image/materia/piety_3.png";
      case "Piety Materia IV":
        return "./image/materia/piety_4.png";
      case "Piety Materia V":
        return "./image/materia/piety_5.png";
      case "Piety Materia VI":
        return "./image/materia/piety_6.png";
      case "Piety Materia VII":
        return "./image/materia/piety_7.png";
      case "Piety Materia VIII":
        return "./image/materia/piety_8.png";
      case "Piety Materia IX":
        return "./image/materia/piety_9.png";
      case "Piety Materia X":
        return "./image/materia/piety_10.png";
      case "Piety Materia XI":
        return "./image/materia/piety_11.png";
      case "Piety Materia XII":
        return "./image/materia/piety_12.png";
      case "Craftsman's Command Materia I":
        return "./image/materia/control_1.png";
      case "Craftsman's Command Materia II":
        return "./image/materia/control_2.png";
      case "Craftsman's Command Materia III":
        return "./image/materia/control_3.png";
      case "Craftsman's Command Materia IV":
        return "./image/materia/control_4.png";
      case "Craftsman's Command Materia V":
        return "./image/materia/control_5.png";
      case "Craftsman's Command Materia VI":
        return "./image/materia/control_6.png";
      case "Craftsman's Command Materia VII":
        return "./image/materia/control_7.png";
      case "Craftsman's Command Materia VIII":
        return "./image/materia/control_8.png";
      case "Craftsman's Command Materia IX":
        return "./image/materia/control_9.png";
      case "Craftsman's Command Materia X":
        return "./image/materia/control_10.png";
      case "Craftsman's Command Materia XI":
        return "./image/materia/control_11.png";
      case "Craftsman's Command Materia XII":
        return "./image/materia/control_12.png";
      case "Craftsman's Cunning Materia I":
        return "./image/materia/cp_1.png";
      case "Craftsman's Cunning Materia II":
        return "./image/materia/cp_2.png";
      case "Craftsman's Cunning Materia III":
        return "./image/materia/cp_3.png";
      case "Craftsman's Cunning Materia IV":
        return "./image/materia/cp_4.png";
      case "Craftsman's Cunning Materia V":
        return "./image/materia/cp_5.png";
      case "Craftsman's Cunning Materia VI":
        return "./image/materia/cp_6.png";
      case "Craftsman's Cunning Materia VII":
        return "./image/materia/cp_7.png";
      case "Craftsman's Cunning Materia VIII":
        return "./image/materia/cp_8.png";
      case "Craftsman's Cunning Materia IX":
        return "./image/materia/cp_9.png";
      case "Craftsman's Cunning Materia X":
        return "./image/materia/cp_10.png";
      case "Craftsman's Cunning Materia XI":
        return "./image/materia/cp_11.png";
      case "Craftsman's Cunning Materia XII":
        return "./image/materia/cp_12.png";
      case "Craftsman's Competence Materia I":
        return "./image/materia/cms_1.png";
      case "Craftsman's Competence Materia II":
        return "./image/materia/cms_2.png";
      case "Craftsman's Competence Materia III":
        return "./image/materia/cms_3.png";
      case "Craftsman's Competence Materia IV":
        return "./image/materia/cms_4.png";
      case "Craftsman's Competence Materia V":
        return "./image/materia/cms_5.png";
      case "Craftsman's Competence Materia VI":
        return "./image/materia/cms_6.png";
      case "Craftsman's Competence Materia VII":
        return "./image/materia/cms_7.png";
      case "Craftsman's Competence Materia VIII":
        return "./image/materia/cms_8.png";
      case "Craftsman's Competence Materia IX":
        return "./image/materia/cms_9.png";
      case "Craftsman's Competence Materia X":
        return "./image/materia/cms_10.png";
      case "Craftsman's Competence Materia XI":
        return "./image/materia/cms_11.png";
      case "Craftsman's Competence Materia XII":
        return "./image/materia/cms_12.png";
      case "Gatherer's Grasp Materia I":
        return "./image/materia/gp_1.png";
      case "Gatherer's Grasp Materia II":
        return "./image/materia/gp_2.png";
      case "Gatherer's Grasp Materia III":
        return "./image/materia/gp_3.png";
      case "Gatherer's Grasp Materia IV":
        return "./image/materia/gp_4.png";
      case "Gatherer's Grasp Materia V":
        return "./image/materia/gp_5.png";
      case "Gatherer's Grasp Materia VI":
        return "./image/materia/gp_6.png";
      case "Gatherer's Grasp Materia VII":
        return "./image/materia/gp_7.png";
      case "Gatherer's Grasp Materia VIII":
        return "./image/materia/gp_8.png";
      case "Gatherer's Grasp Materia IX":
        return "./image/materia/gp_9.png";
      case "Gatherer's Grasp Materia X":
        return "./image/materia/gp_10.png";
      case "Gatherer's Grasp Materia XI":
        return "./image/materia/gp_11.png";
      case "Gatherer's Grasp Materia XII":
        return "./image/materia/gp_12.png";
      case "Gatherer's Guerdon Materia I":
        return "./image/materia/gathering_1.png";
      case "Gatherer's Guerdon Materia II":
        return "./image/materia/gathering_2.png";
      case "Gatherer's Guerdon Materia III":
        return "./image/materia/gathering_3.png";
      case "Gatherer's Guerdon Materia IV":
        return "./image/materia/gathering_4.png";
      case "Gatherer's Guerdon Materia V":
        return "./image/materia/gathering_5.png";
      case "Gatherer's Guerdon Materia VI":
        return "./image/materia/gathering_6.png";
      case "Gatherer's Guerdon Materia VII":
        return "./image/materia/gathering_7.png";
      case "Gatherer's Guerdon Materia VIII":
        return "./image/materia/gathering_8.png";
      case "Gatherer's Guerdon Materia IX":
        return "./image/materia/gathering_9.png";
      case "Gatherer's Guerdon Materia X":
        return "./image/materia/gathering_10.png";
      case "Gatherer's Guerdon Materia XI":
        return "./image/materia/gathering_11.png";
      case "Gatherer's Guerdon Materia XII":
        return "./image/materia/gathering_12.png";
      case "Gatherer's Guile Materia I":
        return "./image/materia/perception_1.png";
      case "Gatherer's Guile Materia II":
        return "./image/materia/perception_2.png";
      case "Gatherer's Guile Materia III":
        return "./image/materia/perception_3.png";
      case "Gatherer's Guile Materia IV":
        return "./image/materia/perception_4.png";
      case "Gatherer's Guile Materia V":
        return "./image/materia/perception_5.png";
      case "Gatherer's Guile Materia VI":
        return "./image/materia/perception_6.png";
      case "Gatherer's Guile Materia VII":
        return "./image/materia/perception_7.png";
      case "Gatherer's Guile Materia VIII":
        return "./image/materia/perception_8.png";
      case "Gatherer's Guile Materia IX":
        return "./image/materia/perception_9.png";
      case "Gatherer's Guile Materia X":
        return "./image/materia/perception_10.png";
      case "Gatherer's Guile Materia XI":
        return "./image/materia/perception_11.png";
      case "Gatherer's Guile Materia XII":
        return "./image/materia/perception_12.png";
      default:
        log.error(`[ERROR] Materia '${materia}' doesn't exist.'`);
        return "./image/materia/fallback.png";
    }
  }
}
