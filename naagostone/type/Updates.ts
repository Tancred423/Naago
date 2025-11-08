export interface UpdateDescription {
  html: string;
  markdown: string;
}

export interface Update {
  title: string;
  date: number;
  link: string;
  description: UpdateDescription;
}

export interface UpdateResponse {
  updates: Update[];
}
