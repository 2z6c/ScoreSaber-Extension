export type SongScore = {
  userId: number;
  leaderboardId: number;
  pp: number;
  score: number;
  accuracy?: number;
}

export type UserScore = {
  userId: number;
  lastUpdated: number;
  accumlatedScores: number[];
}