const mysql = require('../naagoLib/mysql')
const FfxivUtil = require('../naagoLib/FfxivUtil')
const moment = require('moment-timezone')
const DiscordUtil = require('./DiscordUtil')
const CharacterDataDto = require('../dto/CharacterDataDto')
const ConsoleUtil = require('./ConsoleUtil')

module.exports = class DbUtil {
  static async getMysqlResult(sql) {
    const res = await mysql.query(sql)
    if (res[0][0]) return res[0][0]?.length === 0 ? null : res[0][0]
    else if (res[0]) return res[0]?.length === 0 ? null : res[0]
    else return undefined
  }

  ////////////////////////////////////////////
  // Verifications
  ////////////////////////////////////////////

  static async getCharacterVerification(userId) {
    try {
      const sql = `
        SELECT *
        FROM verifications
        WHERE user_id=${mysql.escape(userId)}
      `

      return await this.getMysqlResult(sql)
    } catch (err) {
      ConsoleUtil.logError(
        `Getting verification code was NOT successful. Error: ${err.message}`,
        err,
      )
      return undefined
    }
  }

  static async setVerificationCode(userId, characterId, verificationCode) {
    try {
      if (await this.getCharacterVerification(userId)) {
        // Update
        const sql = `
          UPDATE verifications
          SET verification_code=${mysql.escape(verificationCode)}
          WHERE user_id=${mysql.escape(userId)}
        `

        await mysql.query(sql)
      } else {
        // Insert
        const sql = `
          INSERT INTO verifications (user_id,character_id,verification_code,is_verified)
          VALUES (
            ${mysql.escape(userId)},
            ${mysql.escape(characterId)},
            ${mysql.escape(verificationCode)},
            ${mysql.escape(false)}
          )
        `

        await mysql.query(sql)
      }

      return true
    } catch (err) {
      ConsoleUtil.logError(
        `Setting verification code was NOT successful. Error: ${err.message}`,
        err,
      )
      return false
    }
  }

  static async verifyCharacter(userId, characterId) {
    try {
      const sql = `
        UPDATE verifications
        SET character_id=${mysql.escape(characterId)},
            is_verified=${mysql.escape(true)}
        WHERE user_id=${mysql.escape(userId)}
      `

      await mysql.query(sql)

      return true
    } catch (err) {
      ConsoleUtil.logError(
        `Verifying character was NOT successful. Error: ${err.message}`,
        err,
      )
      return false
    }
  }

  ////////////////////////////////////////////
  // Fetch Character
  ////////////////////////////////////////////

  static async fetchCharacterCached(interaction, characterId) {
    try {
      const loadingEmote = await DiscordUtil.getEmote(
        interaction.client,
        'loading',
      )

      // Get character data
      let sql = `
        SELECT *
        FROM character_data
        WHERE character_id=${mysql.escape(characterId)}
      `

      const characterDataRes = await this.getMysqlResult(sql)

      const latestUpdate =
        typeof characterDataRes?.latest_update === 'object'
          ? moment(new Date(characterDataRes.latest_update))
          : undefined

      const characterData =
        typeof characterDataRes?.json_string === 'string'
          ? JSON.parse(characterDataRes.json_string)
          : undefined

      let characterDataDto = new CharacterDataDto(latestUpdate, characterData)

      if (characterDataDto.characterData) {
        return characterDataDto
      }

      // No character data yet. Cache now.
      await interaction.editReply({
        content: `${loadingEmote} Updating lodestone data. This might take several seconds.`,
        components: [],
        files: [],
        embeds: [],
        attachments: [],
      })

      const character = await FfxivUtil.getCharacterById(characterId)
      if (!character) return undefined

      const now = Date.now()
      const nowSQL = moment(now).tz('UTC').format('YYYY-MM-DD HH:mm:ss')

      sql = `
        INSERT INTO character_data (character_id,latest_update,json_string)
        VALUES (
          ${mysql.escape(characterId)},
          ${mysql.escape(nowSQL)},
          ${mysql.escape(JSON.stringify(character))}
        )
      `

      await mysql.query(sql)

      sql = `
        SELECT *
        FROM character_data
        WHERE character_id=${mysql.escape(characterId)}
      `

      const res = await this.getMysqlResult(sql)

      characterDataDto = new CharacterDataDto(
        moment(new Date(res.latest_update)),
        JSON.parse(res.json_string),
      )

      return res ? characterDataDto : undefined
    } catch (err) {
      console.error(
        `[ERROR] Fetching character was NOT successful. Error: ${err.message}`,
      )
      return undefined
    }
  }

  static async fetchCharacter(interaction, characterId) {
    try {
      const loadingEmote = await DiscordUtil.getEmote(
        interaction.client,
        'loading',
      )

      // Get character data
      let sql = `
        SELECT *
        FROM character_data
        WHERE character_id=${mysql.escape(characterId)}
      `

      const characterDataRes = await this.getMysqlResult(sql)

      const latestUpdate =
        typeof characterDataRes?.latest_update === 'object'
          ? moment(new Date(characterDataRes.latest_update))
          : undefined

      const characterData =
        typeof characterDataRes?.json_string === 'string'
          ? JSON.parse(characterDataRes.json_string)
          : undefined

      const characterDataDto = new CharacterDataDto(latestUpdate, characterData)

      if (characterDataDto.characterData) {
        const lastUpdate = characterDataDto.latestUpdate
        const now = Date.now()
        const nowSQL = moment(now).tz('UTC').format('YYYY-MM-DD HH:mm:ss')

        if (now - lastUpdate > 15 * 60 * 1000) {
          // Last update was >= 15 minutes ago. Update data now.
          await interaction.editReply({
            content: `${loadingEmote} Updating lodestone data. This might take several seconds.`,
            components: [],
            files: [],
            embeds: [],
            attachments: [],
          })

          const character = await FfxivUtil.getCharacterById(characterId)
          sql = `
            UPDATE character_data
            SET latest_update=${mysql.escape(nowSQL)},
                json_string=${mysql.escape(JSON.stringify(character))}
            WHERE character_id=${mysql.escape(characterId)}
          `

          await mysql.query(sql)

          sql = `
            SELECT *
            FROM character_data
            WHERE character_id=${mysql.escape(characterId)}
          `

          const res = await this.getMysqlResult(sql)

          const characterDataDto = new CharacterDataDto(
            moment(new Date(res.latest_update)),
            JSON.parse(res.json_string),
          )

          return res ? characterDataDto : undefined
        } else {
          // Last update was for < 2 hours. Use cached data.
          return characterDataDto
        }
      } else {
        // No character data yet. Cache now.
        await interaction.editReply({
          content: `${loadingEmote} Updating lodestone data. This might take several seconds.`,
          components: [],
          files: [],
          embeds: [],
          attachments: [],
        })

        const character = await FfxivUtil.getCharacterById(characterId)
        if (!character) return undefined

        const now = Date.now()
        const nowSQL = moment(now).tz('UTC').format('YYYY-MM-DD HH:mm:ss')

        sql = `
          INSERT INTO character_data (character_id,latest_update,json_string)
          VALUES (
            ${mysql.escape(characterId)},
            ${mysql.escape(nowSQL)},
            ${mysql.escape(JSON.stringify(character))}
          )
        `

        await mysql.query(sql)

        sql = `
          SELECT *
          FROM character_data
          WHERE character_id=${mysql.escape(characterId)}
        `

        const res = await this.getMysqlResult(sql)

        const characterDataDto = new CharacterDataDto(
          moment(new Date(res.latest_update)),
          JSON.parse(res.json_string),
        )

        return res ? characterDataDto : undefined
      }
    } catch (err) {
      ConsoleUtil.logError(
        `Fetching character was NOT successful. Error: ${err.message}`,
        err,
      )

      return undefined
    }
  }

  // No refreshing, just taking the cache
  static async getCharacter(userId) {
    try {
      // Get character id
      let sql = `
        SELECT character_id
        FROM verifications
        WHERE user_id=${mysql.escape(userId)}
      `

      const res = await this.getMysqlResult(sql)
      if (!res) return undefined

      const characterId = res.character_id

      sql = `
        SELECT json_string
        FROM character_data
        WHERE character_id=${mysql.escape(characterId)}
      `

      const res2 = await this.getMysqlResult(sql)

      const characterData = res2 ? JSON.parse(res2.json_string) : undefined

      return {
        ID: characterId,
        name: characterData?.name,
        server: characterData?.server,
      }
    } catch (err) {
      ConsoleUtil.logError(
        `Getting character was NOT successful. Error: ${err.message}`,
        err,
      )
      return undefined
    }
  }

  ////////////////////////////////////////////
  // Profile Pages
  ////////////////////////////////////////////

  static async getProfilePages(userId) {
    try {
      const sql = `
        SELECT *
        FROM profile_pages
        WHERE user_id=${mysql.escape(userId)}
      `

      const res = await this.getMysqlResult(sql)

      return res
        ? {
            profilePage: res.profile_page,
            subProfilePage: res.sub_profile_page,
          }
        : { profilePage: 'profile', subProfilePage: undefined }
    } catch (err) {
      ConsoleUtil.logError(`Getting profile page was NOT successful.`, err)
      return { profilePage: 'profile', subProfilePage: undefined }
    }
  }

  static async updateProfilePage(userId, profilePage, subProfilePage) {
    try {
      let sql = `
        SELECT user_id
        FROM profile_pages
        WHERE user_id=${mysql.escape(userId)}
      `

      const res = await this.getMysqlResult(sql)

      if (res) {
        // Update
        sql = `
          UPDATE profile_pages
          SET profile_page=${mysql.escape(profilePage)},
              sub_profile_page=${mysql.escape(subProfilePage)}
          WHERE user_id=${mysql.escape(userId)}
        `

        await mysql.query(sql)
      } else {
        // Insert
        sql = `
          INSERT INTO profile_pages (user_id,profile_page,sub_profile_page)
          VALUES (
            ${mysql.escape(userId)},
            ${mysql.escape(profilePage)},
            ${mysql.escape(subProfilePage)}
          )
        `

        await mysql.query(sql)
      }

      return true
    } catch (err) {
      ConsoleUtil.logError(`Updating profile page was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Theme
  ////////////////////////////////////////////

  static async getTheme(userId) {
    try {
      const sql = `
        SELECT theme
        FROM themes
        WHERE user_id=${mysql.escape(userId)}
      `

      const res = await this.getMysqlResult(sql)
      return res?.theme ?? 'dark'
    } catch (err) {
      ConsoleUtil.logError(`Getting theme was NOT successful.`, err)
      return undefined
    }
  }

  static async setTheme(userId, theme) {
    try {
      const sql = `
        SELECT *
        FROM themes
        WHERE user_id=${mysql.escape(userId)}
      `

      const themeRes = await this.getMysqlResult(sql)

      if (themeRes) {
        // Update
        const sql = `
          UPDATE themes
          SET theme=${mysql.escape(theme)}
          WHERE user_id=${mysql.escape(userId)}
        `

        await mysql.query(sql)
      } else {
        // Insert
        const sql = `
          INSERT INTO themes (user_id,theme)
          VALUES (
            ${mysql.escape(userId)},
            ${mysql.escape(theme)}
          )
        `

        await mysql.query(sql)
      }

      return true
    } catch (err) {
      ConsoleUtil.logError(`Setting theme was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Favorites
  ////////////////////////////////////////////

  static async getFavorites(userId) {
    try {
      const sql = `
        SELECT character_id, character_name, server
        FROM favorites
        WHERE user_id=${mysql.escape(userId)}
      `

      const res = await mysql.query(sql)
      return res?.[0]
    } catch (err) {
      ConsoleUtil.logError(`Getting favorites was NOT successful.`, err)
      return undefined
    }
  }

  static async addFavorite(userId, characterId, characterName, server) {
    try {
      const favorites = await this.getFavorites(userId)

      if (favorites?.length >= 25) return 'capped'

      if (!favorites?.find((o) => o.character_id == characterId)) {
        // Insert
        const sql = `
          INSERT INTO favorites (user_id,character_id,character_name,server)
          VALUES (
            ${mysql.escape(userId)},
            ${mysql.escape(characterId)},
            ${mysql.escape(characterName)},
            ${mysql.escape(server)}
          )
        `

        await mysql.query(sql)

        return true
      }

      return 'existant'
    } catch (err) {
      ConsoleUtil.logError(`Adding favorite was NOT successful.`, err)
      return false
    }
  }

  static async removeFavorite(userId, characterId) {
    try {
      const favorites = await this.getFavorites(userId)

      if (favorites?.find((o) => o.character_id == characterId)) {
        const sql = `
          DELETE FROM favorites
          WHERE user_id=${mysql.escape(userId)}
          AND character_id=${mysql.escape(characterId)}
        `

        await mysql.query(sql)

        return true
      }

      return 'notfound'
    } catch (err) {
      ConsoleUtil.logError(`Removing favorite was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Fashion Report
  ////////////////////////////////////////////
  static async getFashionReportData() {
    try {
      const sql = `
        SELECT *
        FROM fashion_report_data
        ORDER BY week DESC
        LIMIT 1
      `

      const res = await mysql.query(sql)

      return res?.[0]?.[0]
    } catch (err) {
      ConsoleUtil.logError(
        `Getting fashion report data was NOT successful.`,
        err,
      )
      return undefined
    }
  }

  static async setFashionReportData(data) {
    try {
      const currentData = await this.getFashionReportData()

      if (currentData && currentData.week == data.week) {
        // Update
        const sql = `
          UPDATE fashion_report_data
          SET username=${mysql.escape(data.username)},
              nickname=${mysql.escape(data.nickname)},
              profile_url=${mysql.escape(data.profileUrl)},
              avatar=${mysql.escape(data.avatar)},
              verified=${mysql.escape(data.verified)},
              tweet_url=${mysql.escape(data.tweetUrl)},
              title=${mysql.escape(data.title)},
              image_url=${mysql.escape(data.imageUrl)},
              timestamp=${mysql.escape(data.timestamp)}
          WHERE week=${mysql.escape(currentData.week)}
        `

        await mysql.query(sql)
      } else {
        // Insert
        const sql = `
          INSERT INTO fashion_report_data (week, username,nickname,profile_url,avatar,verified,tweet_url,title,image_url,timestamp)
            VALUES (
              ${mysql.escape(data.week)},
              ${mysql.escape(data.username)},
              ${mysql.escape(data.nickname)},
              ${mysql.escape(data.profileUrl)},
              ${mysql.escape(data.avatar)},
              ${mysql.escape(data.verified)},
              ${mysql.escape(data.tweetUrl)},
              ${mysql.escape(data.title)},
              ${mysql.escape(data.imageUrl)},
              ${mysql.escape(data.timestamp)}
            )
        `

        await mysql.query(sql)
      }

      return true
    } catch (err) {
      ConsoleUtil.logError(
        `Setting fashion report data was NOT successful.`,
        err,
      )
      return false
    }
  }

  ////////////////////////////////////////////
  // Topic
  ////////////////////////////////////////////
  static async getTopicByTitle(title, date) {
    try {
      const sql = `
        SELECT *
        FROM topic_data
        WHERE title=${mysql.escape(title)}
        AND date=${mysql.escape(
          moment(date).tz('Europe/London').format('YYYY-MM-DD HH:mm:ss'),
        )}
      `

      const res = await mysql.query(sql)

      return res?.[0]?.[0]
    } catch (err) {
      ConsoleUtil.logError(`Getting topic by title was NOT successful.`, err)
      return undefined
    }
  }

  static async addTopic(topic) {
    try {
      if (!(await this.getTopicByTitle(topic.title, topic.date))) {
        // Insert
        const sql = `
          INSERT INTO topic_data (title,date)
          VALUES (
            ${mysql.escape(topic.title)},
            ${mysql.escape(
              moment(topic.date)
                .tz('Europe/London')
                .format('YYYY-MM-DD HH:mm:ss'),
            )}
          )
        `

        await mysql.query(sql)

        return true
      } else return 'existant'
    } catch (err) {
      ConsoleUtil.logError(`Adding topic was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Notices
  ////////////////////////////////////////////
  static async getNoticeByTitle(title, date) {
    try {
      const sql = `
        SELECT *
        FROM notice_data
        WHERE title=${mysql.escape(title)}
        AND date=${mysql.escape(
          moment(date).tz('Europe/London').format('YYYY-MM-DD HH:mm:ss'),
        )}
      `

      const res = await mysql.query(sql)

      return res?.[0]?.[0]
    } catch (err) {
      ConsoleUtil.logError(`Getting notice by title was NOT successful.`, err)
      return undefined
    }
  }

  static async addNotices(notice) {
    try {
      if (!(await this.getNoticeByTitle(notice.title, notice.date))) {
        // Insert
        const sql = `
          INSERT INTO notice_data (title,tag,date,link,details)
          VALUES (
            ${mysql.escape(notice.title)},
            ${mysql.escape(notice.tag)},
            ${mysql.escape(
              moment(notice.date)
                .tz('Europe/London')
                .format('YYYY-MM-DD HH:mm:ss'),
            )},
            ${mysql.escape(notice.link)},
            ${mysql.escape(notice.details)}
          )
        `

        await mysql.query(sql)

        return true
      } else return 'existant'
    } catch (err) {
      ConsoleUtil.logError(`Adding notice was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Maintenance
  ////////////////////////////////////////////
  static async getCurrentMaintenances() {
    try {
      const now = moment().tz('Europe/London').format('YYYY-MM-DD HH:mm:ss')

      const sql = `
        SELECT *
        FROM maintenance_data
        WHERE m_from <= ${mysql.escape(now)}
        AND m_to >= ${mysql.escape(now)}
        ORDER BY id DESC
      `

      let res = await mysql.query(sql)

      if (res?.[0]?.length < 1) res = undefined
      else res = res?.[0]

      return res
    } catch (err) {
      ConsoleUtil.logError(
        `Getting current maintenances was NOT successful.`,
        err,
      )
      return undefined
    }
  }

  static async getMaintenanceByTitle(title, date) {
    try {
      const sql = `
        SELECT *
        FROM maintenance_data
        WHERE title=${mysql.escape(title)}
        AND date=${mysql.escape(
          moment(date).tz('Europe/London').format('YYYY-MM-DD HH:mm:ss'),
        )}
      `

      const res = await mysql.query(sql)

      return res?.[0]?.[0]
    } catch (err) {
      ConsoleUtil.logError(
        `Getting maintenance by title was NOT successful.`,
        err,
      )
      return undefined
    }
  }

  static async addMaintenance(maintenance) {
    try {
      if (
        !(await this.getMaintenanceByTitle(maintenance.title, maintenance.date))
      ) {
        // Insert
        const sql = `
          INSERT INTO maintenance_data (title,tag,date,link,details,m_from,m_to)
          VALUES (
            ${mysql.escape(maintenance.title)},
            ${mysql.escape(maintenance.tag)},
            ${mysql.escape(
              moment(maintenance.date)
                .tz('Europe/London')
                .format('YYYY-MM-DD HH:mm:ss'),
            )},
            ${mysql.escape(maintenance.link)},
            ${mysql.escape(maintenance.details)},
            ${mysql.escape(
              maintenance.from
                ?.tz('Europe/London')
                .format('YYYY-MM-DD HH:mm:ss'),
            )},
            ${mysql.escape(
              maintenance.to?.tz('Europe/London').format('YYYY-MM-DD HH:mm:ss'),
            )}
          )
        `

        await mysql.query(sql)

        return true
      } else return 'existant'
    } catch (err) {
      ConsoleUtil.logError(`Adding maintenance was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Updates
  ////////////////////////////////////////////
  static async getUpdateByTitle(title, date) {
    try {
      const sql = `
        SELECT *
        FROM update_data
        WHERE title=${mysql.escape(title)}
        AND date=${mysql.escape(
          moment(date).tz('Europe/London').format('YYYY-MM-DD HH:mm:ss'),
        )}
      `

      const res = await mysql.query(sql)

      return res?.[0]?.[0]
    } catch (err) {
      ConsoleUtil.logError(`Getting update by title was NOT successful.`, err)
      return undefined
    }
  }

  static async addUpdate(update) {
    try {
      if (!(await this.getUpdateByTitle(update.title, update.date))) {
        // Insert
        const sql = `
          INSERT INTO update_data (title,date,link,details)
          VALUES (
            ${mysql.escape(update.title)},
            ${mysql.escape(
              moment(update.date)
                .tz('Europe/London')
                .format('YYYY-MM-DD HH:mm:ss'),
            )},
            ${mysql.escape(update.link)},
            ${mysql.escape(update.details)}
          )
        `

        await mysql.query(sql)

        return true
      } else return 'existant'
    } catch (err) {
      ConsoleUtil.logError(`Adding update was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Status
  ////////////////////////////////////////////
  static async getStatusByTitle(title, date) {
    try {
      const sql = `
        SELECT *
        FROM status_data
        WHERE title=${mysql.escape(title)}
        AND date=${mysql.escape(
          moment(date).tz('Europe/London').format('YYYY-MM-DD HH:mm:ss'),
        )}
      `

      const res = await mysql.query(sql)

      return res?.[0]?.[0]
    } catch (err) {
      ConsoleUtil.logError(`Getting status by title was NOT successful.`, err)
      return undefined
    }
  }

  static async addStatus(status) {
    try {
      if (!(await this.getStatusByTitle(status.title, status.date))) {
        // Insert
        const sql = `
          INSERT INTO status_data (title,tag,date,link,details)
          VALUES (
            ${mysql.escape(status.title)},
            ${mysql.escape(status.tag)},
            ${mysql.escape(
              moment(status.date)
                .tz('Europe/London')
                .format('YYYY-MM-DD HH:mm:ss'),
            )},
            ${mysql.escape(status.link)},
            ${mysql.escape(status.details)}
          )
        `

        await mysql.query(sql)

        return true
      } else return 'existant'
    } catch (err) {
      ConsoleUtil.logError(`Adding status was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Setup
  ////////////////////////////////////////////
  static async getSetups(type) {
    try {
      const sql = `
        SELECT *
        FROM setups
        WHERE type=${mysql.escape(type)}
      `

      const res = await mysql.query(sql)

      return res?.[0]
    } catch (err) {
      ConsoleUtil.logError(`Getting setups was NOT successful.`, err)
      return undefined
    }
  }

  static async getSetupChannelId(guildId, type) {
    try {
      const sql = `
        SELECT channel_id
        FROM setups
        WHERE guild_id=${mysql.escape(guildId)}
        AND type=${mysql.escape(type)}
      `

      const res = await this.getMysqlResult(sql)

      return res?.channel_id
    } catch (err) {
      ConsoleUtil.logError(
        `Getting ${type} channel ID was NOT successful.`,
        err,
      )
      return undefined
    }
  }

  static async setSetupChannelId(guildId, type, channelId) {
    try {
      if (await this.getSetupChannelId(guildId, type)) {
        // Update
        const sql = `
          UPDATE setups
          SET channel_id=${mysql.escape(channelId)}
          WHERE guild_id=${mysql.escape(guildId)}
          AND type=${mysql.escape(type)}
        `

        await mysql.query(sql)
      } else {
        // Insert
        const sql = `
          INSERT INTO setups (guild_id,type,channel_id)
          VALUES (
            ${mysql.escape(guildId)},
            ${mysql.escape(type)},
            ${mysql.escape(channelId)}
          )
        `

        await mysql.query(sql)
      }
      return true
    } catch (err) {
      ConsoleUtil.logError(
        `Setting ${type} channel ID was NOT successful.`,
        err,
      )
      return false
    }
  }

  static async unsetSetupChannelId(guildId, type) {
    try {
      const sql = `
        DELETE FROM setups
        WHERE guild_id=${mysql.escape(guildId)}
        AND type=${mysql.escape(type)}
      `

      await mysql.query(sql)

      return true
    } catch (err) {
      ConsoleUtil.logError(
        `Unsetting ${type} channel ID was NOT successful.`,
        err,
      )
      return false
    }
  }

  ////////////////////////////////////////////
  // Setup - Purge
  ////////////////////////////////////////////

  static async purgeGuild(guildId) {
    try {
      const sql = `
        DELETE FROM setups
        WHERE guild_id=${mysql.escape(guildId)}
      `

      await mysql.query(sql)

      return true
    } catch (err) {
      ConsoleUtil.logError(`Guild purge was NOT successful.`, err)
      return false
    }
  }

  ////////////////////////////////////////////
  // Purge
  ////////////////////////////////////////////

  static async purgeUser(userId, characterId) {
    try {
      let sql = `
        DELETE FROM character_data
        WHERE character_id=${mysql.escape(characterId)}
      `

      await mysql.query(sql)

      sql = `
        DELETE FROM social_medias
        WHERE character_id=${mysql.escape(characterId)}
      `

      await mysql.query(sql)

      sql = `
        DELETE FROM favorites
        WHERE user_id=${mysql.escape(userId)}
      `

      await mysql.query(sql)

      sql = `
        DELETE FROM profile_pages
        WHERE user_id=${mysql.escape(userId)}
      `

      await mysql.query(sql)

      sql = `
        DELETE FROM themes
        WHERE user_id=${mysql.escape(userId)}
      `

      await mysql.query(sql)

      sql = `
        DELETE FROM verifications
        WHERE user_id=${mysql.escape(userId)}
        AND character_id=${mysql.escape(characterId)}
      `

      await mysql.query(sql)

      return true
    } catch (err) {
      ConsoleUtil.logError(
        `User purge was NOT successful. Error: ${err.message}`,
        err,
      )
      return false
    }
  }
}
