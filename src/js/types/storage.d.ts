export interface Favorite {
  id: string;
  avatar: string;
  country: string;
  name: string;
}

export interface Bookmark {
  hash: string;
  title: string;
  link: string;
  characteristic?: string;
  difficultyName?: DifficultyName;
}

export type DifficultyName = 'Easy'
  | 'Normal'
  | 'Hard'
  | 'Expert'
  | 'ExpertPlus';

export interface User extends Favorite {
  locked: boolean;
  lastUpdated: number;
  globalRank: number;
  countryRank: number;
}