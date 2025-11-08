import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { UpdateData, updateData } from "../schema/lodestone-news.ts";
import { Update } from "../../naagostone/type/Updates.ts";

export class UpdatesRepository {
  static async find(
    title: string,
    date: Date,
  ): Promise<UpdateData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(updateData)
      .where(
        and(
          eq(updateData.title, title),
          eq(updateData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0];
  }

  static async add(
    update: Update,
  ): Promise<void> {
    const dateSQL = moment(update.date).tz("Europe/London").toDate();
    const currentTopic = await this.find(update.title, dateSQL);
    if (currentTopic) {
      throw new AlreadyInDatabaseError(
        "This update is already in the database",
      );
    }

    await database
      .insert(updateData)
      .values({
        title: update.title,
        link: update.link,
        date: dateSQL,
        description: update.description.markdown,
      });
  }
}
