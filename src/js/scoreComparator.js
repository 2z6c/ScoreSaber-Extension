/**
 * @typedef {import("./types/storage").SongScore} SongScore
 */


const accumlatedScores = [];
const PP_DECAY = 0.965;

/**
 * @param {SongScore[]} scores
 */
export function initAccumlatedScores( scores ) {
  scores = scores.filter(v=>v.pp).sort((a,b)=>a.pp-b.pp);
  const l = scores.length - 1;
  const tmp = [];
  for ( let i = 1, f = PP_DECAY; i <= l; i++, f *= PP_DECAY ) {
    tmp[i] = f *scores[i].pp;
  }
  accumlatedScores[l] = tmp[l];
  for ( let i = l; i > 0; i-- ) {
    accumlatedScores[i-1] = accumlatedScores[i] + tmp[i-1];
  }
}
