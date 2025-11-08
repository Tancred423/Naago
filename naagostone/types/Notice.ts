export interface NoticeDescription {
  html: string;
  markdown: string;
}

export interface Notice {
  tag: string | null;
  title: string;
  date: number;
  link: string;
  description: NoticeDescription;
}
