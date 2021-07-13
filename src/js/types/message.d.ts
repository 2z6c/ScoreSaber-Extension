import { Player } from "../integration/scoresaber";
import { SongScore, UserScore } from "./database";
import { User } from "./storage";

export declare namespace Meggaging {
  export type Channel = {
    getRanked: (
      incremental?: boolean
    ) => Promise<{
      updateFinished: number;
    }>;

    getScore: (
      query :{
        leaderboardId: number;
        userId: string;
      }
    ) => Promise<SongScore>;

    getUser: (userId:string) => Promise<UserScore>;

    updateScores: (
      userId: string
    ) => Promise<{
      updateFinished: number;
    }>;

    predictScore: (
      query: {
        leaderboardId: number;
        pp: number;
      }
    ) => Promise<number>;

    getStar: (
      query: {
        hash: string;
        diffText: string;
      }
    ) => Promise<number>;

    deleteDB: () => Promise<void>;

    fetchUser: (id:string) => Promise<Player>;
  }

  export type ChannelName = keyof Channel;
}