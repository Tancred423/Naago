const {
  width,
  height,
  borderRadius,
  maxLevel,
  maxLevelLimited
} = require('../config.json')
const DbUtil = require('./DbUtil')
const DiscordUtil = require('./DiscordUtil')
const NaagoUtil = require('./NaagoUtil')
const { createCanvas, loadImage } = require('canvas')
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const moment = require('moment')

module.exports = class ProfileUtil {
  static async getImage(
    interaction,
    character,
    isVerified,
    profilePage,
    subProfilePage = null
  ) {
    const profile = new Profile(interaction, character, isVerified)

    if (profilePage === 'profile') return await profile.getProfile()
    else if (profilePage === 'classesjobs') {
      if (subProfilePage === 'dohdol') return await profile.getDohDol()
      else return await profile.getDowDom()
    } else if (profilePage === 'equipment') return await profile.getEquipment()
    else if (profilePage === 'attributes') return await profile.getAttributes()
  }

  static getEmbed(interaction, character, isVerified, profilePage, isMe) {
    const profile = new Profile(interaction, character, isVerified)

    if (profilePage === 'socialmedia') return profile.getSocialMedia(isMe)
  }

  static getComponents(profilePage, subProfilePage, commandName, characterId) {
    const components = []

    components.push(
      new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel('Profile')
          .setCustomId(`${commandName}-profile-${characterId}`)
          .setStyle(profilePage === 'profile' ? 'PRIMARY' : 'SECONDARY'),
        new MessageButton()
          .setLabel('Classes/Jobs')
          .setCustomId(`${commandName}-classesjobs-${characterId}`)
          .setStyle(profilePage === 'classesjobs' ? 'PRIMARY' : 'SECONDARY'),
        new MessageButton()
          .setLabel('Equipment')
          .setCustomId(`${commandName}-equipment-${characterId}`)
          .setStyle(profilePage === 'equipment' ? 'PRIMARY' : 'SECONDARY'),
        new MessageButton()
          .setLabel('Attributes')
          .setCustomId(`${commandName}-attributes-${characterId}`)
          .setStyle(profilePage === 'attributes' ? 'PRIMARY' : 'SECONDARY'),
        new MessageButton()
          .setLabel('Social Media')
          .setCustomId(`${commandName}-socialmedia-${characterId}`)
          .setStyle(profilePage === 'socialmedia' ? 'PRIMARY' : 'SECONDARY')
      )
    )

    if (subProfilePage) {
      components.push(
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel('DoW/DoM')
            .setCustomId(`${commandName}-dowdom-${characterId}`)
            .setStyle(subProfilePage === 'dowdom' ? 'PRIMARY' : 'SECONDARY'),
          new MessageButton()
            .setLabel('DoH/DoL')
            .setCustomId(`${commandName}-dohdol-${characterId}`)
            .setStyle(subProfilePage === 'dohdol' ? 'PRIMARY' : 'SECONDARY')
        )
      )
    }

    return components
  }
}

class Profile {
  constructor(interaction, character, isVerified) {
    this.interaction = interaction
    this.character = character
    this.isVerified = isVerified
    this.userId = interaction.user.id
  }

  async getTheme() {
    const themeName = await DbUtil.getTheme(this.userId)
    return themeName === 'classic'
      ? require('../themes/classic.json')
      : themeName === 'light'
      ? require('../themes/light.json')
      : require('../themes/dark.json')
  }

  async getProfile() {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme()

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    ctx.fillStyle = theme.background
    ctx.roundRect(0, 0, width, height, borderRadius).fill()

    // Background border
    ctx.strokeStyle = theme.background_border
    ctx.lineWidth = 5
    ctx.roundRect(0, 0, width, height, borderRadius).stroke()

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = 'Character'
    ctx.fillStyle = theme.window_title
    ctx.font = `normal 20px roboto condensed`
    ctx.fillText(windowTitle, 10, 8, width / 2)

    // Window title name
    const windowTitleName = this.character.name.toUpperCase()
    ctx.fillStyle = theme.window_title_name
    ctx.textAlign = 'right'
    ctx.font = `normal 20px romanus`
    ctx.fillText(windowTitleName, width - 10, 8, width / 2)
    ctx.textAlign = 'left'

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline
    ctx.lineWidth = 3
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke()

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`
    ctx.fillStyle = theme.acj_level
    ctx.font = `normal 20px MiedingerMediumW00-Regular`
    ctx.fillText(acjLevel, 446, 50, 330)

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon)
    ctx.drawImage(acjIcon, 446, 75, 50, 50)

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name)
    ctx.drawImage(acjName, 446 + 50, 75)

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage('./images/naago_verified.png')
      ctx.drawImage(verificationSticker, 690, 40, 90, 90)
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save()
    ctx.strokeStyle = theme.portrait_border
    ctx.lineWidth = 4
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke()
    ctx.clip()

    // Portrait
    const portrait = await loadImage(this.character.portrait)
    ctx.drawImage(portrait, 450, 135, 330, 450)

    // Item level icon
    const gearIcon = await loadImage('./images/gear.png')
    ctx.drawImage(gearIcon, 690, 142)

    // Item level
    ctx.fillStyle = theme.item_level
    ctx.font = `bold 30px roboto condensed`
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50)
    ctx.textAlign = 'left'

    ctx.restore()

    ////////////////////////////////////////////
    // Name and Title
    ////////////////////////////////////////////

    // Title
    ctx.textAlign = 'center'
    if (this.character.title) {
      ctx.fillStyle = theme.title
      ctx.font = `normal 35px myriad pro`
      ctx.fillText(`< ${this.character.title} >`, 450 / 2, 100, 410)
    }

    // Name
    ctx.fillStyle = theme.name
    ctx.font = `normal 60px myriad pro`
    ctx.fillText(
      this.character.name,
      450 / 2,
      40 + (this.character.title ? 0 : 20),
      410
    )
    ctx.textAlign = 'left'

    ////////////////////////////////////////////
    // Character Info
    ////////////////////////////////////////////
    let yAdd = 97

    const profileBlock = new ProfileBlock(theme, ctx, yAdd)
    await profileBlock.add(
      'World',
      `${this.character.server.world} (${this.character.server.dc})`,
      null,
      true
    )
    await profileBlock.add(
      'Started',
      this.character.started === 'Private'
        ? 'Private'
        : moment(this.character.started * 1000).format('Do MMM Y')
    )
    await profileBlock.add(
      'City-state',
      this.character.town.name,
      this.character.town.icon,
      false,
      true
    )
    await profileBlock.add(
      'Characteristics',
      `${this.character.characteristics.race} (${this.character.characteristics.tribe})`,
      this.character.characteristics.gender == '♀'
        ? './images/emoji_female.png'
        : './images/emoji_male.png',
      true
    )
    await profileBlock.add('Nameday', this.character.nameday, null, true)
    await profileBlock.add(
      `Grand Company: ${this.character.grand_company.name}`,
      this.character.grand_company.rank,
      this.character.grand_company.icon,
      true
    )
    await profileBlock.add(
      'Free Company',
      this.character.free_company ? this.character.free_company.name : '-',
      this.character.free_company ? this.character.free_company.icon : null,
      true
    )
    await profileBlock.add(
      'Guardian',
      this.character.guardian_deity.name,
      this.character.guardian_deity.icon,
      true
    )
    await profileBlock.add(
      'Achievements',
      this.character.amount_achievements === 'Private'
        ? 'Private'
        : `${this.character.amount_achievements} (${this.character.ap} AP)`,
      './images/achievements.png',
      false,
      false,
      true,
      1
    )
    await profileBlock.add(
      'Mounts',
      this.character.amount_mounts,
      null,
      false,
      true,
      true,
      2
    )
    await profileBlock.add(
      'Minions',
      this.character.amount_minions,
      null,
      false,
      true,
      true,
      3
    )

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer('image/png')
  }

  async getDowDom() {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme()

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    ctx.fillStyle = theme.background
    ctx.roundRect(0, 0, width, height, borderRadius).fill()

    // Background border
    ctx.strokeStyle = theme.background_border
    ctx.lineWidth = 5
    ctx.roundRect(0, 0, width, height, borderRadius).stroke()

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = 'Character'
    ctx.fillStyle = theme.window_title
    ctx.font = `normal 20px roboto condensed`
    ctx.fillText(windowTitle, 10, 8, width / 2)

    // Window title name
    const windowTitleName = this.character.name.toUpperCase()
    ctx.fillStyle = theme.window_title_name
    ctx.textAlign = 'right'
    ctx.font = `normal 20px romanus`
    ctx.fillText(windowTitleName, width - 10, 8, width / 2)
    ctx.textAlign = 'left'

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline
    ctx.lineWidth = 3
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke()

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`
    ctx.fillStyle = theme.acj_level
    ctx.font = `normal 20px MiedingerMediumW00-Regular`
    ctx.fillText(acjLevel, 446, 50, 330)

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon)
    ctx.drawImage(acjIcon, 446, 75, 50, 50)

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name)
    ctx.drawImage(acjName, 446 + 50, 75)

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage('./images/naago_verified.png')
      ctx.drawImage(verificationSticker, 690, 40, 90, 90)
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save()
    ctx.strokeStyle = theme.portrait_border
    ctx.lineWidth = 4
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke()
    ctx.clip()

    // Portrait
    const portrait = await loadImage(this.character.portrait)
    ctx.drawImage(portrait, 450, 135, 330, 450)

    // Item level icon
    const gearIcon = await loadImage('./images/gear.png')
    ctx.drawImage(gearIcon, 690, 142)

    // Item level
    ctx.fillStyle = theme.item_level
    ctx.font = `bold 30px roboto condensed`
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50)
    ctx.textAlign = 'left'

    ctx.restore()

    ////////////////////////////////////////////
    // Tank
    ////////////////////////////////////////////
    let fWidth = 410
    let yAdd = 40
    let x = 10

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 195, borderRadius).fill()

    const tankIcon = await loadImage('./images/tank.png')
    ctx.drawImage(tankIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Tank', x + 35, yAdd + 8)

    // Classes / Jobs
    yAdd -= 30
    let classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd)
    await classJobBlock.add(this.character.paladin)
    await classJobBlock.add(this.character.warrior)
    await classJobBlock.add(this.character.darkknight)
    await classJobBlock.add(this.character.gunbreaker)

    ////////////////////////////////////////////
    // Melee DPS
    ////////////////////////////////////////////
    yAdd = 237
    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 235, borderRadius).fill()

    const meleeIcon = await loadImage('./images/dps_melee.png')
    ctx.drawImage(meleeIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Melee DPS', x + 35, yAdd + 8)

    // Classes / Jobs
    yAdd -= 30
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd)
    await classJobBlock.add(this.character.monk)
    await classJobBlock.add(this.character.dragoon)
    await classJobBlock.add(this.character.ninja)
    await classJobBlock.add(this.character.samurai)
    await classJobBlock.add(this.character.reaper)

    ////////////////////////////////////////////
    // Healer
    ////////////////////////////////////////////
    x = 225
    yAdd = 40
    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 195, borderRadius).fill()

    const healerIcon = await loadImage('./images/healer.png')
    ctx.drawImage(healerIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Healer', x + 35, yAdd + 8)

    // Classes / Jobs
    yAdd -= 30
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd)
    await classJobBlock.add(this.character.whitemage)
    await classJobBlock.add(this.character.scholar)
    await classJobBlock.add(this.character.astrologian)
    await classJobBlock.add(this.character.sage)

    ////////////////////////////////////////////
    // Ranged DPS
    ////////////////////////////////////////////
    yAdd = 237
    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 155, borderRadius).fill()

    const rangedIcon = await loadImage('./images/dps_ranged.png')
    ctx.drawImage(rangedIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Ranged DPS', x + 35, yAdd + 8)

    // Classes / Jobs
    yAdd -= 30
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd)
    await classJobBlock.add(this.character.bard)
    await classJobBlock.add(this.character.machinist)
    await classJobBlock.add(this.character.dancer)

    ////////////////////////////////////////////
    // Magical DPS
    ////////////////////////////////////////////
    yAdd = 394
    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 193, borderRadius).fill()

    const magicIcon = await loadImage('./images/dps_magic.png')
    ctx.drawImage(magicIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Magical DPS', x + 35, yAdd + 8)

    // Classes / Jobs
    yAdd -= 30
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd)
    await classJobBlock.add(this.character.blackmage)
    await classJobBlock.add(this.character.summoner)
    await classJobBlock.add(this.character.redmage)
    await classJobBlock.add(this.character.bluemage)

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer('image/png')
  }

  async getDohDol() {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme()

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    ctx.fillStyle = theme.background
    ctx.roundRect(0, 0, width, height, borderRadius).fill()

    // Background border
    ctx.strokeStyle = theme.background_border
    ctx.lineWidth = 5
    ctx.roundRect(0, 0, width, height, borderRadius).stroke()

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = 'Character'
    ctx.fillStyle = theme.window_title
    ctx.font = `normal 20px roboto condensed`
    ctx.fillText(windowTitle, 10, 8, width / 2)

    // Window title name
    const windowTitleName = this.character.name.toUpperCase()
    ctx.fillStyle = theme.window_title_name
    ctx.textAlign = 'right'
    ctx.font = `normal 20px romanus`
    ctx.fillText(windowTitleName, width - 10, 8, width / 2)
    ctx.textAlign = 'left'

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline
    ctx.lineWidth = 3
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke()

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`
    ctx.fillStyle = theme.acj_level
    ctx.font = `normal 20px MiedingerMediumW00-Regular`
    ctx.fillText(acjLevel, 446, 50, 330)

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon)
    ctx.drawImage(acjIcon, 446, 75, 50, 50)

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name)
    ctx.drawImage(acjName, 446 + 50, 75)

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage('./images/naago_verified.png')
      ctx.drawImage(verificationSticker, 690, 40, 90, 90)
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save()
    ctx.strokeStyle = theme.portrait_border
    ctx.lineWidth = 4
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke()
    ctx.clip()

    // Portrait
    const portrait = await loadImage(this.character.portrait)
    ctx.drawImage(portrait, 450, 135, 330, 450)

    // Item level icon
    const gearIcon = await loadImage('./images/gear.png')
    ctx.drawImage(gearIcon, 690, 142)

    // Item level
    ctx.fillStyle = theme.item_level
    ctx.font = `bold 30px roboto condensed`
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50)
    ctx.textAlign = 'left'

    ctx.restore()

    ////////////////////////////////////////////
    // DoH
    ////////////////////////////////////////////
    let fWidth = 410
    let yAdd = 40
    let x = 10

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 355, borderRadius).fill()

    const tankIcon = await loadImage('./images/doh.png')
    ctx.drawImage(tankIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Disciplines of the Hand', x + 35, yAdd + 8)

    // Classes / Jobs
    yAdd -= 30
    let classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd)
    await classJobBlock.add(this.character.carpenter)
    await classJobBlock.add(this.character.blacksmith)
    await classJobBlock.add(this.character.armorer)
    await classJobBlock.add(this.character.goldsmith)
    await classJobBlock.add(this.character.leatherworker)
    await classJobBlock.add(this.character.weaver)
    await classJobBlock.add(this.character.alchemist)
    await classJobBlock.add(this.character.culinarian)

    ////////////////////////////////////////////
    // DoL
    ////////////////////////////////////////////
    x = 225
    yAdd = 40
    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 155, borderRadius).fill()

    const dolIcon = await loadImage('./images/dol.png')
    ctx.drawImage(dolIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Disciplines of the Land', x + 35, yAdd + 8)

    // Classes / Jobs
    yAdd -= 30
    classJobBlock = new ClassJobBlock(theme, ctx, x, yAdd)
    await classJobBlock.add(this.character.miner)
    await classJobBlock.add(this.character.botanist)
    await classJobBlock.add(this.character.fisher)

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer('image/png')
  }

  async getEquipment() {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme()

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    ctx.fillStyle = theme.background
    ctx.roundRect(0, 0, width, height, borderRadius).fill()

    // Background border
    ctx.strokeStyle = theme.background_border
    ctx.lineWidth = 5
    ctx.roundRect(0, 0, width, height, borderRadius).stroke()

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = 'Character'
    ctx.fillStyle = theme.window_title
    ctx.font = `normal 20px roboto condensed`
    ctx.fillText(windowTitle, 10, 8, width / 2)

    // Window title name
    const windowTitleName = this.character.name.toUpperCase()
    ctx.fillStyle = theme.window_title_name
    ctx.textAlign = 'right'
    ctx.font = `normal 20px romanus`
    ctx.fillText(windowTitleName, width - 10, 8, width / 2)
    ctx.textAlign = 'left'

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline
    ctx.lineWidth = 3
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke()

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`
    ctx.fillStyle = theme.acj_level
    ctx.font = `normal 20px MiedingerMediumW00-Regular`
    ctx.fillText(acjLevel, 446, 50, 330)

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon)
    ctx.drawImage(acjIcon, 446, 75, 50, 50)

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name)
    ctx.drawImage(acjName, 446 + 50, 75)

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage('./images/naago_verified.png')
      ctx.drawImage(verificationSticker, 690, 40, 90, 90)
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save()
    ctx.strokeStyle = theme.portrait_border
    ctx.lineWidth = 4
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke()
    ctx.clip()

    // Portrait
    const portrait = await loadImage(this.character.portrait)
    ctx.drawImage(portrait, 450, 135, 330, 450)

    // Item level icon
    const gearIcon = await loadImage('./images/gear.png')
    ctx.drawImage(gearIcon, 690, 142)

    // Item level
    ctx.fillStyle = theme.item_level
    ctx.font = `bold 30px roboto condensed`
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50)
    ctx.textAlign = 'left'

    ctx.restore()

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer('image/png')
  }

  async getAttributes() {
    ////////////////////////////////////////////
    // Theme
    ////////////////////////////////////////////
    const theme = await this.getTheme()

    ////////////////////////////////////////////
    // Canvas
    ////////////////////////////////////////////
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    ////////////////////////////////////////////
    // Background
    ////////////////////////////////////////////

    // Background fill
    ctx.fillStyle = theme.background
    ctx.roundRect(0, 0, width, height, borderRadius).fill()

    // Background border
    ctx.strokeStyle = theme.background_border
    ctx.lineWidth = 5
    ctx.roundRect(0, 0, width, height, borderRadius).stroke()

    ////////////////////////////////////////////
    // Window
    ////////////////////////////////////////////

    // Window title
    const windowTitle = 'Character'
    ctx.fillStyle = theme.window_title
    ctx.font = `normal 20px roboto condensed`
    ctx.fillText(windowTitle, 10, 8, width / 2)

    // Window title name
    const windowTitleName = this.character.name.toUpperCase()
    ctx.fillStyle = theme.window_title_name
    ctx.textAlign = 'right'
    ctx.font = `normal 20px romanus`
    ctx.fillText(windowTitleName, width - 10, 8, width / 2)
    ctx.textAlign = 'left'

    // Window title underline
    ctx.strokeStyle = theme.window_title_underline
    ctx.lineWidth = 3
    ctx.roundRect(10, 35, width - 20, 0, borderRadius).stroke()

    ////////////////////////////////////////////
    // Active ClassJob (ACJ)
    ////////////////////////////////////////////

    // ACJ level
    const acjLevel = `Level ${this.character.active_classjob.level}`
    ctx.fillStyle = theme.acj_level
    ctx.font = `normal 20px MiedingerMediumW00-Regular`
    ctx.fillText(acjLevel, 446, 50, 330)

    // ACJ icon
    const acjIcon = await loadImage(this.character.active_classjob.icon)
    ctx.drawImage(acjIcon, 446, 75, 50, 50)

    // ACJ name
    const acjName = await loadImage(this.character.active_classjob.name)
    ctx.drawImage(acjName, 446 + 50, 75)

    ////////////////////////////////////////////
    // Verification sticker
    ////////////////////////////////////////////
    if (this.isVerified) {
      const verificationSticker = await loadImage('./images/naago_verified.png')
      ctx.drawImage(verificationSticker, 690, 40, 90, 90)
    }

    ////////////////////////////////////////////
    // Portrait
    ////////////////////////////////////////////

    // Portrait border
    ctx.save()
    ctx.strokeStyle = theme.portrait_border
    ctx.lineWidth = 4
    ctx.roundRect(450, 135, 330, 450, borderRadius).stroke()
    ctx.clip()

    // Portrait
    const portrait = await loadImage(this.character.portrait)
    ctx.drawImage(portrait, 450, 135, 330, 450)

    // Item level icon
    const gearIcon = await loadImage('./images/gear.png')
    ctx.drawImage(gearIcon, 690, 142)

    // Item level
    ctx.fillStyle = theme.item_level
    ctx.font = `bold 30px roboto condensed`
    ctx.fillText(this.character.item_level, 700 + 20, 140, 50)
    ctx.textAlign = 'left'

    ctx.restore()

    ////////////////////////////////////////////
    // HP MP
    ////////////////////////////////////////////
    let fWidth = 410
    let yAdd = 50
    let x = 10

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth + 10, 100, borderRadius).fill()

    ctx.textAlign = 'left'
    ctx.fillStyle = theme.block_content
    ctx.font = `normal 16px MiedingerMediumW00-Regular`
    ctx.fillText('HP', x + 20, yAdd + 40)

    ctx.textAlign = 'right'
    ctx.fillStyle = theme.block_content_highlight
    ctx.font = `normal 32px roboto condensed`
    ctx.fillText(this.character.hp, 195, yAdd + 25)

    ctx.fillStyle = theme.green
    ctx.roundRect(x + 20, yAdd + 60, 165, 7, 0).fill()

    ctx.textAlign = 'left'
    ctx.fillStyle = theme.block_content
    ctx.font = `normal 16px MiedingerMediumW00-Regular`
    ctx.fillText(
      this.character.mp_gp_cp_parameter_name,
      fWidth / 2 + 40,
      yAdd + 40
    )

    ctx.textAlign = 'right'
    ctx.fillStyle = theme.block_content_highlight
    ctx.font = `normal 32px roboto condensed`
    ctx.fillText(this.character.mp_gp_cp, fWidth, yAdd + 25)

    ctx.fillStyle = theme.purple
    ctx.roundRect(fWidth / 2 + 40, yAdd + 60, 165, 7, 0).fill()

    ////////////////////////////////////////////
    // Attributes
    ////////////////////////////////////////////
    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`
    yAdd = 160

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth + 10, 100, borderRadius).fill()

    const attrIcon = await loadImage('./images/attributes.png')
    ctx.drawImage(attrIcon, x + 10, yAdd + 8, 20, 20)

    ctx.textAlign = 'left'
    ctx.fillStyle = theme.block_content
    ctx.fillText('Attributes', x + 35, yAdd + 8)

    // Stats left
    let stats = new Stats(theme, ctx, x, yAdd, fWidth)
    stats.add('Strength', this.character.strength, theme.green)
    stats.add('Dexterity', this.character.dexterity, theme.green)
    stats.add('Vitality', this.character.vitality, theme.green)

    // Stats right
    x = 225
    stats = new Stats(theme, ctx, x, yAdd, fWidth)
    stats.add('Intelligence', this.character.intelligence, theme.purple)
    stats.add('Mind', this.character.mind, theme.purple)

    ////////////////////////////////////////////
    // Offensive Properties
    ////////////////////////////////////////////
    ctx.textAlign = 'left'
    x = 10
    yAdd = 269

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill()

    const offPropIcon = await loadImage('./images/offensive_properties.png')
    ctx.drawImage(offPropIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_content
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Offensive Properties', x + 35, yAdd + 8)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth)
    stats.add('Critical Hit', this.character.critical_hit_rate)
    stats.add('Determination', this.character.determination)
    stats.add('Direct Hit Rate', this.character.direct_hit_rate)

    ////////////////////////////////////////////
    // Defensive Properties
    ////////////////////////////////////////////
    ctx.textAlign = 'left'
    x = 225

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill()

    const defPropIcon = await loadImage('./images/defensive_properties.png')
    ctx.drawImage(defPropIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_content
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Defensive Properties', x + 35, yAdd + 8)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth)
    stats.add('Defense', this.character.defense)
    stats.add('Magic Defense', this.character.magic_defense)

    ////////////////////////////////////////////
    // Physical Properties
    ////////////////////////////////////////////
    ctx.textAlign = 'left'
    x = 10
    yAdd = 378

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill()

    const physPropIcon = await loadImage('./images/physical_properties.png')
    ctx.drawImage(physPropIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_content
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Physical Properties', x + 35, yAdd + 8)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth)
    stats.add('Attack Power', this.character.attack_power)
    stats.add('Skill Speed', this.character.skill_speed)

    ////////////////////////////////////////////
    // Mental Properties
    ////////////////////////////////////////////
    ctx.textAlign = 'left'
    x = 225

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill()

    const mentalPropIcon = await loadImage('./images/mental_properties.png')
    ctx.drawImage(mentalPropIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_content
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Mental Properties', x + 35, yAdd + 8)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth)
    stats.add('Attack Magic Potency', this.character.attack_magic_potency)
    stats.add('Healing Magic Potency', this.character.healing_magic_potency)
    stats.add('Spell Speed', this.character.spell_speed)

    ////////////////////////////////////////////
    // Gear
    ////////////////////////////////////////////
    ctx.textAlign = 'left'
    x = 10
    yAdd = 487

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill()

    const gIcon = await loadImage('./images/gear.png')
    ctx.drawImage(gIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_content
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Gear', x + 35, yAdd + 8)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth)
    stats.add('Average Item Level', this.character.item_level)

    ////////////////////////////////////////////
    // Role
    ////////////////////////////////////////////
    ctx.textAlign = 'left'
    x = 225

    ctx.fillStyle = theme.block_background
    ctx.roundRect(x, yAdd, fWidth / 2, 100, borderRadius).fill()

    const roleIcon = await loadImage('./images/role.png')
    ctx.drawImage(roleIcon, x + 10, yAdd + 8, 20, 20)

    ctx.fillStyle = theme.block_content
    ctx.font = `normal 16px roboto condensed`
    ctx.fillText('Role', x + 35, yAdd + 8)

    ctx.fillStyle = theme.block_title
    ctx.font = `normal 16px roboto condensed`

    // Stats
    stats = new Stats(theme, ctx, x, yAdd, fWidth)
    stats.add('Tenacity', this.character.tenacity)
    stats.add('Piety', this.character.piety)

    ////////////////////////////////////////////
    // Return buffer
    ////////////////////////////////////////////
    return canvas.toBuffer('image/png')
  }

  async getSocialMedia(isMe) {
    const client = this.interaction.client
    const characterId = this.character.ID
    const socialMedias = await DbUtil.getSocialMedia(characterId)

    const embed = new MessageEmbed()
      .setColor(await DiscordUtil.getBotColor(this.interaction))
      .setTitle(
        `${this.character.name}${NaagoUtil.getApostropheS(
          this.character.name
        )} social media`
      )
      .setThumbnail(this.character.avatar)
      .setDescription('')

    if (socialMedias.length === 0) {
      embed.setDescription(
        `No social medias were linked yet. ${
          isMe ? 'You' : 'They'
        } can do so with \`/socialmedia add\`.`
      )
    } else {
      for (const socialMedia of socialMedias) {
        embed.setDescription(
          embed.description +
            `\n[${await DiscordUtil.getEmote(
              client,
              socialMedia.platform
            )} ${NaagoUtil.capitalizeFirstLetter(socialMedia.platform)}](${
              socialMedia.url
            })`
        )
      }
    }

    return embed
  }
}

class ProfileBlock {
  constructor(theme, ctx, yAdd) {
    this.theme = theme
    this.ctx = ctx
    this.yAdd = yAdd
  }

  async add(
    title,
    content,
    iconLink = null,
    fullWidth = false,
    rightSide = false,
    triple = false,
    slot = null
  ) {
    let x = rightSide ? 230 : 20
    if (triple && slot === 2) x = 265
    if (triple && slot === 3) x = 350

    let fWidth = fullWidth ? 410 : 410 / 2 - 5
    if (triple && slot === 1) fWidth = 240
    if (triple && (slot === 2 || slot === 3)) fWidth = 80
    if (!rightSide) this.yAdd += 55

    const maxWidth = iconLink ? fWidth - 60 : fWidth - 20

    this.ctx.fillStyle = this.theme.block_background
    this.ctx.roundRect(x, this.yAdd, fWidth, 50, borderRadius).fill()

    this.ctx.fillStyle = this.theme.block_title
    this.ctx.font = `normal 16px roboto condensed`
    this.ctx.fillText(title, x + 10, this.yAdd + 3, maxWidth)

    this.ctx.fillStyle = this.theme.block_content
    this.ctx.font = `bold 24px arial`
    this.ctx.fillText(content, x + 10, this.yAdd + 18, maxWidth)

    if (iconLink) {
      const icon = await loadImage(iconLink)
      this.ctx.drawImage(
        icon,
        fWidth - icon.width / 2 - 5 + (rightSide ? fWidth + 10 : 0),
        this.yAdd + 10
      )
    }
  }
}

class ClassJobBlock {
  constructor(theme, ctx, x, yAdd) {
    this.theme = theme
    this.ctx = ctx
    this.x = x
    this.yAdd = yAdd
  }

  async add(job) {
    this.yAdd += 40

    const jobIcon = await loadImage(job.icon)
    this.ctx.drawImage(jobIcon, this.x + 10, this.yAdd + 25, 30, 30)

    const localMaxLevel =
      job.unlockstate === 'Blue Mage' ? maxLevelLimited : maxLevel

    this.ctx.textAlign = 'right'
    this.ctx.fillStyle =
      job.level === localMaxLevel
        ? this.theme.block_content_highlight
        : this.theme.block_content
    this.ctx.font = `bold 30px arial`
    this.ctx.fillText(job.level, this.x + 80, this.yAdd + 23)
    this.ctx.textAlign = 'left'

    this.ctx.fillStyle = this.theme.block_content
    this.ctx.font = `bold 16px arial`
    this.ctx.fillText(job.unlockstate, this.x + 85, this.yAdd + 27)

    this.ctx.fillStyle = this.theme.exp_bar
    this.ctx.roundRect(this.x + 85, this.yAdd + 47, 100, 5, borderRadius).fill()
  }
}

class Stats {
  constructor(theme, ctx, x, yAdd, fWidth) {
    this.theme = theme
    this.ctx = ctx
    this.x = x
    this.yAdd = yAdd - 10
    this.fWidth = fWidth
  }

  add(title, content, color = this.theme.block_title) {
    this.yAdd += 20

    this.ctx.fillStyle = color
    this.ctx.textAlign = 'left'
    this.ctx.fillText(title, this.x + 10, this.yAdd + 23, 140)

    this.ctx.fillStyle = this.theme.block_title
    this.ctx.textAlign = 'right'
    this.ctx.fillText(
      content,
      this.x > 200 ? this.fWidth : this.fWidth / 2,
      this.yAdd + 23
    )
  }
}
