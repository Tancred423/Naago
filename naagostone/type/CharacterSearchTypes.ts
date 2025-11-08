export interface CharacterSearchResult {
  avatar: string;
  id: number;
  lang: string;
  name: string;
  rank_name: string | null;
  rank_icon: string | null;
  world: string;
  dc: string;
}

export interface SearchPagination {
  page: number | null;
  page_total: number | null;
  page_next: number | null;
  page_prev: number | null;
}

export interface CharacterSearchResponse {
  list: CharacterSearchResult[];
  pagination: SearchPagination;
}
