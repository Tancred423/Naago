import { and, desc, eq, gte, lte } from "drizzle-orm";
import { database } from "../connection.ts";
import moment from "moment";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { MaintenanceData, maintenanceData } from "../schema/lodestone-news.ts";
import { Maintenance } from "../../naagostone/type/Maintenance.ts";

export class MaintenancesRepository {
  static async find(
    title: string,
    date: Date,
  ): Promise<MaintenanceData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(maintenanceData)
      .where(
        and(
          eq(maintenanceData.title, title),
          eq(maintenanceData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0];
  }

  static async add(
    topic: Maintenance,
  ): Promise<void> {
    const dateSQL = moment(topic.date).tz("Europe/London").toDate();
    const currentTopic = await this.find(topic.title, dateSQL);
    if (currentTopic) {
      throw new AlreadyInDatabaseError(
        "This maintenance is already in the database",
      );
    }

    await database
      .insert(maintenanceData)
      .values({
        title: topic.title,
        link: topic.link,
        date: dateSQL,
        description: topic.description.markdown,
      });
  }

  static async findActive(): Promise<MaintenanceData[]> {
    const now = moment().tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(maintenanceData)
      .where(
        and(
          lte(maintenanceData.startDate, now),
          gte(maintenanceData.endDate, now),
        ),
      )
      .orderBy(desc(maintenanceData.id));

    return result;
  }
}
