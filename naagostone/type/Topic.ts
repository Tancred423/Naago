export interface TopicDescription {
  html: string;
  markdown: string;
}

export interface Topic {
  title: string;
  link: string;
  date: number;
  banner: string;
  description: TopicDescription;
}

export interface TopicResponse {
  topics: Topic[];
}
