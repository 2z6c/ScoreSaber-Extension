/**
 * @typedef {import("./types/database").SongScore} SongScore
 */

// const accumlatedScores = [];
const PP_DECAY = 0.965;

/**
 * @param {SongScore[]} scores
 * @param {number} [totalPP]
 * @returns {number[]}
 */
export function initAccumlatedScores( scores, totalPP ) {
  if ( !scores ) return [];
  scores = scores.filter(v=>v.pp).sort((a,b)=>b.pp-a.pp);
  const tmp = [scores[0].pp];
  for ( let i = 1, f = PP_DECAY; i < scores.length; i++, f *= PP_DECAY ) {
    tmp[i] = tmp[i-1] + f * scores[i].pp;
  }
  tmp.push(totalPP ?? tmp[tmp.length-1]);
  return tmp;
}

/**
 * @param {SongScore[]} scores
 * @returns {SongScore[]}
 */
export function sortPPAsc( scores ) {
  return scores.filter(v=>v.pp).sort((a,b)=>b.pp-a.pp);
}

/**
 * @typedef User
 * @property {SongScore[]} score
 * @property {number[]} accumlatedScores
 * @param {User} user
 * @typedef Score
 * @property {number} leaderboardId
 * @property {number} pp
 * @param {Score} newScore
 * @returns {Promise<number>}
 */
export async function predictScoreGain( user, newScore ) {
  let oldRank = user.score.findIndex(s=>s.leaderboardId===newScore.leaderboardId);
  if ( oldRank < 0 ) oldRank = user.score.length - 1;
  if ( (user.score[oldRank]?.pp ?? 0) > newScore.pp ) return 0;
  const newRank = user.score.findIndex(v=>v.pp < newScore.pp );
  const newPP = newScore.pp * PP_DECAY ** newRank;
  const oldPP = user.score[oldRank].pp * PP_DECAY ** oldRank;
  let gain = newPP - oldPP;
  console.log( `song[${newScore.leaderboardId}] from rank[${oldRank}](${oldPP}pp) to rank[${newRank}](${newPP}pp) will adds ${gain}pp`);
  return gain - (user.accumlatedScores[oldRank] - user.accumlatedScores[newRank]) * (1 - PP_DECAY);
}


