const mysql = require('../naagoLib/mysql')
const FfxivUtil = require('../naagoLib/FfxivUtil')
const moment = require('moment')

module.exports = class DbUtil {
  static async getMysqlResult(sql) {
    const res = await mysql.query(sql)
    if (res[0][0]) return res[0][0]?.length === 0 ? null : res[0][0]
    else if (res[0]) return res[0]?.length === 0 ? null : res[0]
    else return undefined
  }

  static async getCharacterVerification(userId) {
    const sql = `
        SELECT *
        FROM verifications
        WHERE user_id=${mysql.escape(userId)}
      `

    return await this.getMysqlResult(sql)
  }

  static async setVerificationCode(userId, characterId, verificationCode) {
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
  }

  static async verifyCharacter(userId, characterId) {
    const sql = `
      UPDATE verifications
      SET character_id=${mysql.escape(characterId)},
          is_verified=${mysql.escape(true)}
      WHERE user_id=${mysql.escape(userId)}
    `

    await mysql.query(sql)
  }

  static async fetchCharacter(interaction, characterId) {
    // Get character data
    let sql = `
      SELECT *
      FROM character_data
      WHERE character_id=${mysql.escape(characterId)}
    `

    const characterDataRes = await this.getMysqlResult(sql)
    const characterData =
      characterDataRes && typeof characterDataRes.json_string === 'string'
        ? JSON.parse(characterDataRes.json_string)
        : undefined

    if (characterData) {
      const lastUpdate = new Date(characterData.last_update).getTime()
      const now = Date.now()
      const nowSQL = moment(now).format('YYYY-MM-DD HH:mm:ss')

      if (now - lastUpdate > 2 * 60 * 60 * 1000) {
        // Last update was for >= 2 hours. Update data now.
        interaction?.followUp({
          content: 'Updating lodestone data. This might take several seconds.',
          ephemeral: true
        })

        const character = await FfxivUtil.getCharacterById(characterId)
        sql = `
            UPDATE character_data
            SET last_update=${mysql.escape(nowSQL)},
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

        return res ? JSON.parse(res.json_string) : undefined
      } else {
        // Last update was for < 2 hours. Use cached data.
        return characterData
      }
    } else {
      // No character data yet. Cache now.
      interaction?.followUp({
        content: 'Updating lodestone data. This might take several seconds.',
        ephemeral: true
      })

      const character = await FfxivUtil.getCharacterById(characterId)
      const now = Date.now()
      const nowSQL = moment(now).format('YYYY-MM-DD HH:mm:ss')

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

      return res ? JSON.parse(res.json_string) : undefined
    }
  }

  static async getProfilePages(userId) {
    const sql = `
        SELECT *
        FROM profile_pages
        WHERE user_id=${mysql.escape(userId)}
      `

    const res = await this.getMysqlResult(sql)

    return res
      ? { profilePage: res.profile_page, subProfilePage: res.sub_profile_page }
      : { profilePage: 'profile', subProfilePage: undefined }
  }

  static async updateProfilePage(userId, profilePage, subProfilePage) {
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
  }

  static async getSocialMedia(characterId) {
    const sql = `
      SELECT *
      FROM social_medias
      WHERE character_id=${mysql.escape(characterId)}
    `

    const res = await mysql.query(sql)
    return res[0]
  }

  static async addSocialMedia(characterId, platform, url) {
    const sql = `
      SELECT *
      FROM social_medias
      WHERE character_id=${mysql.escape(characterId)}
      AND platform=${mysql.escape(platform)}
    `

    const socialMedia = await this.getMysqlResult(sql)

    if (socialMedia) {
      // Update
      const sql = `
        UPDATE social_medias
        SET url=${mysql.escape(url)}
        WHERE character_id=${mysql.escape(characterId)}
        AND platform=${mysql.escape(platform)}
      `

      await mysql.query(sql)
    } else {
      // Insert
      const sql = `
        INSERT INTO social_medias (character_id,platform,url)
        VALUES (
          ${mysql.escape(characterId)},
          ${mysql.escape(platform)},
          ${mysql.escape(url)}
        )
      `

      await mysql.query(sql)
    }
  }

  static async removeSocialMedia(characterId, platform) {
    const sql = `
      DELETE FROM social_medias
      WHERE character_id=${mysql.escape(characterId)}
      AND platform=${mysql.escape(platform)}
    `

    await mysql.query(sql)
  }

  static async getTheme(userId) {
    const sql = `
      SELECT theme
      FROM themes
      WHERE user_id=${mysql.escape(userId)}
    `

    const res = await this.getMysqlResult(sql)
    return res.theme
  }

  static async setTheme(userId, theme) {
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

      return await this.getMysqlResult(sql)
    } else {
      // Insert
      const sql = `
        INSERT INTO themes (user_id,theme)
        VALUES (
          ${mysql.escape(userId)},
          ${mysql.escape(theme)}
        )
      `

      return await this.getMysqlResult(sql)
    }
  }
}
