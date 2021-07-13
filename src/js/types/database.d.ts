export type SongScore = {
  userId: number;
  leaderboardId: number;
  pp: number;
  score: number;
  accuracy?: number;
}

export type UserScore = {
  userId: string;
  lastUpdated: number;
  accumlatedScores: number[];
}