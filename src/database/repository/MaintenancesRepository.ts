import { and, eq, gte, like, lte, not } from "drizzle-orm";
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
    maintenance: Maintenance,
  ): Promise<void> {
    const dateSQL = moment(maintenance.date).tz("Europe/London").toDate();
    const currentTopic = await this.find(maintenance.title, dateSQL);
    if (currentTopic) {
      throw new AlreadyInDatabaseError(
        "This maintenance is already in the database",
      );
    }

    await database
      .insert(maintenanceData)
      .values({
        tag: maintenance.tag,
        title: maintenance.title,
        link: maintenance.link,
        date: dateSQL,
        description: maintenance.description.markdown,
        startDate: maintenance.start_timestamp
          ? moment(maintenance.start_timestamp).tz("Europe/London").toDate()
          : null,
        endDate: maintenance.end_timestamp ? moment(maintenance.end_timestamp).tz("Europe/London").toDate() : null,
      });
  }

  static async findActive(): Promise<MaintenanceData[]> {
    const now = moment().tz("Europe/London").toDate();

    const activeMaintenances = await database
      .select()
      .from(maintenanceData)
      .where(
        and(
          lte(maintenanceData.startDate, now),
          gte(maintenanceData.endDate, now),
          not(eq(maintenanceData.tag, "Maintenance: Follow-up")),
        ),
      )
      .orderBy(maintenanceData.id);

    const result: MaintenanceData[] = [];
    const MAX_EMBEDS = 5;

    for (const maintenance of activeMaintenances) {
      if (result.length >= MAX_EMBEDS) break;

      result.push(maintenance);

      const followUps = await database
        .select()
        .from(maintenanceData)
        .where(
          and(
            eq(maintenanceData.tag, "Maintenance: Follow-up"),
            like(maintenanceData.title, `%${maintenance.title}%`),
          ),
        )
        .orderBy(maintenanceData.id);

      for (const followUp of followUps) {
        if (result.length >= MAX_EMBEDS) break;
        result.push(followUp);
      }
    }

    return result;
  }
}
