export interface StatusDescription {
  html: string;
  markdown: string;
}

export interface Status {
  tag: string | null;
  title: string;
  date: number;
  link: string;
  description: StatusDescription;
}

export interface StatusResponse {
  statuses: Status[];
}
