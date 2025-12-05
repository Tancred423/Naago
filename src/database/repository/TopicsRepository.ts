import { and, desc, eq, isNotNull } from "drizzle-orm";
import { database } from "../connection.ts";
import { TopicData, topicData } from "../schema/lodestone-news.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { Topic } from "../../naagostone/type/Topic.ts";

export class TopicsRepository {
  public static async find(
    title: string,
    date: Date,
  ): Promise<TopicData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(topicData)
      .where(
        and(
          eq(topicData.title, title),
          eq(topicData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0];
  }

  public static async add(
    topic: Topic,
  ): Promise<void> {
    const dateSQL = moment(topic.date).tz("Europe/London").toDate();
    const currentTopic = await this.find(topic.title, dateSQL);
    if (currentTopic) {
      throw new AlreadyInDatabaseError("This topic is already in the database");
    }

    const timestampLiveLetterSQL = topic.timestamp_live_letter ? new Date(topic.timestamp_live_letter) : null;

    await database
      .insert(topicData)
      .values({
        title: topic.title,
        link: topic.link,
        date: dateSQL,
        banner: topic.banner,
        description: topic.description.markdown,
        timestampLiveLetter: timestampLiveLetterSQL,
      });
  }

  public static async getNewestLiveLetterTimestamp(): Promise<Date | null> {
    const result = await database
      .select({ timestampLiveLetter: topicData.timestampLiveLetter })
      .from(topicData)
      .where(isNotNull(topicData.timestampLiveLetter))
      .orderBy(desc(topicData.timestampLiveLetter))
      .limit(1);

    return result[0]?.timestampLiveLetter ?? null;
  }
}
