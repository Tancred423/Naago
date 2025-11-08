import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { TopicData, topicData } from "../schema/lodestone-news.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { Topic } from "../../naagostone/type/Topic.ts";

export class TopicsRepository {
  static async find(
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

  static async add(
    topic: Topic,
  ): Promise<void> {
    const dateSQL = moment(topic.date).tz("Europe/London").toDate();
    const currentTopic = await this.find(topic.title, dateSQL);
    if (currentTopic) {
      throw new AlreadyInDatabaseError("This topic is already in the database");
    }

    await database
      .insert(topicData)
      .values({
        title: topic.title,
        link: topic.link,
        date: dateSQL,
        banner: topic.banner,
        description: topic.description.markdown,
      });
  }
}
