export declare namespace ScoreSaber {
  export type Schema = {
    songs: Song[];
  }
  export type Song = {
    uid: number;
    id: string;
    name: string;
    songSubName: string;
    songAuthorName: string;
    levelAuthorName: string;
    bpm: number;
    diff: string;
    scores: string;
    scores_day: number;
    ranked: 1 | 0;
    stars: number;
    image: string;
  }

  export type Player = {
    playerInfo: {
      playerId: string;
      playerName: string;
      avatar: string;
      rank: number;
      countryRank: number;
      pp: number;
      country: string;
    };
    error?: {
      message: string;
    }
  }
}