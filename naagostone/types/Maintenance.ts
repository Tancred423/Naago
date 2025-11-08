export interface MaintenanceDescription {
  html: string;
  markdown: string;
}

export interface Maintenance {
  tag: string | null;
  title: string;
  date: number;
  link: string;
  description: MaintenanceDescription;
}
