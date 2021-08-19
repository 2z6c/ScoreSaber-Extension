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

    updateScore: ({
      userId: string,
      score: any,
    }) => Promise<unknown>;
    
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
    updateUser: (query: {
      userId: string;
      rankGlobal?: number;
      rankLobal?: number;
      pp?: number;
    }) => Promise<unknown>;
  }

  export type ChannelName = keyof Channel;
}