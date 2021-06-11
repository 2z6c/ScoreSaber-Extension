// partially
export declare namespace BeatSaver {
  export interface Map {
    key: string;
    hash: string;
    downloadURL: string;
    description: string;
    name: string;
    metadata: MapMetadata;
  }
  export interface MapMetadata {
    bpm: number;
    characteristics: Characteristic[];
    difficulties: Difficulties;
    levelAuthorName: string;
    songAuthorName: string;
    songName: string;
    songSubName: string;
  }
  export interface Difficulties {
    [label:DifficultyLabel]: boolean;
  }
  export interface Characteristic {
    difficulties: {
      [label:DifficultyLabel]: Difficulty | null;
    }
  }
  export interface Difficulty {
    bombs: number;
    duration: number;
    length: number;
    njs: number;
    njsOffset: number;
    notes: number;
    obstables: number;
  }
  export type DifficultyLabel = 'easy' | 'normal' | 'hard' | 'expert' | 'expertPlus';
}