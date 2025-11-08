import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { StatusData, statusData } from "../schema/lodestone-news.ts";
import { Status } from "../../naagostone/type/Status.ts";

export class StatusesRepository {
  static async find(
    title: string,
    date: Date,
  ): Promise<StatusData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(statusData)
      .where(
        and(
          eq(statusData.title, title),
          eq(statusData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0];
  }

  static async add(
    status: Status,
  ): Promise<void> {
    const dateSQL = moment(status.date).tz("Europe/London").toDate();
    const currentTopic = await this.find(status.title, dateSQL);
    if (currentTopic) {
      throw new AlreadyInDatabaseError(
        "This status is already in the database",
      );
    }

    await database
      .insert(statusData)
      .values({
        tag: status.tag,
        title: status.title,
        link: status.link,
        date: dateSQL,
        description: status.description.markdown,
      });
  }
}
