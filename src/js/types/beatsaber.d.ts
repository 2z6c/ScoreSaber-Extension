export declare namespace BeatSaber {
  export type PlaylistSong = {
    hash: string;
    songName?: string;
    levelAuthorName?: string;
    difficulties?: SuggestedDifficulty[];
  }
  export type SuggestedDifficulty = {
    name: string;
    characteristic: 'Standard';
  }
}