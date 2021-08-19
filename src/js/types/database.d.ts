export type SongScore = {
  userId: number;
  leaderboardId: number;
  pp: number;
  score: number;
  accuracy?: number;
  date?: number;
}

export type UserScore = {
  userId: string;
  lastUpdated: number;
  accumlatedScores: number[];
  rankGlobal: number;
  rankLocal: number;
}

export type Level = {
  hash: string;
  diff: string;
  stars: number;
  leaderboardId: number;
}