import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { NoticeData, noticeData } from "../schema/lodestone-news.ts";
import { Notice } from "../../naagostone/type/Notice.ts";

export class NoticesRepository {
  static async find(
    title: string,
    date: Date,
  ): Promise<NoticeData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(noticeData)
      .where(
        and(
          eq(noticeData.title, title),
          eq(noticeData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0];
  }

  static async add(
    notice: Notice,
  ): Promise<void> {
    const dateSQL = moment(notice.date).tz("Europe/London").toDate();
    const currentTopic = await this.find(notice.title, dateSQL);
    if (currentTopic) {
      throw new AlreadyInDatabaseError(
        "This notice is already in the database",
      );
    }

    await database
      .insert(noticeData)
      .values({
        tag: notice.tag,
        title: notice.title,
        link: notice.link,
        date: dateSQL,
        description: notice.description.markdown,
      });
  }
}
