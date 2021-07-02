/**
 * @typedef {import('../types/scoresaber').ScoreSaber.Schema} Schema
 */
import { initAccumlatedScores, sortPPAsc } from '../scoreComparator';
import { scoreManager } from '../scoreManager';
import {readStorage} from '../storage';

export const BASE_URL = 'https://scoresaber.com';
const NEW_API = 'https://new.scoresaber.com/api';

const RANK_URL = (limit,page) => `${BASE_URL}/api.php?function=get-leaderboards&cat=1&limit=${limit}&ranked=1&page=${page}`;
let rank = {};
let _loading = false;
export function isBusy() {
  return _loading;
}

export async function fetchPlayer( id ) {
  const res = await fetch(`${NEW_API}/player/${id}/full`);
  if ( !res.ok ) return;
  return res.json();
}

export async function fetchRankedSongs({difference=false}={}) {
  _loading = true;
  if ( Object.keys(rank).length === 0 ) difference = false;
  const limit = difference ? 50 : 1000;
  let s = 0, d = 0;
  if ( !difference ) {
    console.log('fetch all maps.');
    rank = {};
  }
  REQUEST: for ( let i = 1;; i++ ) {
    console.log('fetch scoresaber ranked data. page ',i);
    try {
      const res = await fetch(RANK_URL(limit,i));
      /** @type {Schema} */
      const data = await res.json();
      if ( data.songs.length === 0 ) break;
      for ( const {id,diff,stars} of data.songs ) {
        if ( !rank[id] ) {
          rank[id] = {};
          s++;
        }
        const diffKey = extructDifficulty(diff);
        if ( rank[id][diffKey] ) break REQUEST;
        rank[id][diffKey] = stars;
        d++;
      }
      await new Promise(r=>setTimeout(r, 3000));
    } catch(e) {
      console.error(e);
      break;
    }
  }
  console.log(`${s.toLocaleString()} maps (${d.toLocaleString()} difficulties) are updated.`);
  chrome.storage.local.set({
    rank,
    lastUpdate: Date.now(),
  });
  _loading = false;
}

export function getLastUpdate() {
  return readStorage('lastUpdate');
}

export async function loadRankedSongs() {
  const _rank = await readStorage('rank');
  if ( _rank ) rank = _rank;
  return rank;
}

const extructDifficulty = _diff_type => _diff_type.split('_')[1].replace('Plus','+');

export function getSongStars( hash, diff ) {
  return rank[hash]?.[diff];
}

/**
 *
 * @param {number} id Player ID
 * @param {'top'|'recent'} order
 */
export async function* fetchPlayerScore( id, order='recent', force=false ) {
  _loading = true;
  for ( let page = 1;; page++ ) {
    console.log('fetch user scores from scoresaber. page ',page);
    try {
      const res = await fetch(`${NEW_API}/player/${id}/scores/${order}/${page}`);
      if ( !res.ok ) throw new Error('unreachable to scoresaber.com.');
      /** @type {import('../types/scoresaber').ScoreSaber.SchemaScores} */
      const data = await res.json();
      if ( !data || !data.scores ) break;
      for ( const score of data.scores ) {
        yield score;
      }
      if ( !force && data.scores.length < 8 ) break;
      await new Promise(r=>setTimeout(r, 300));
    } catch(e) {
      console.error(e);
      break;
    }
  }
  _loading = false;
}

export async function updateUserScores( userId ) {
  const user = await scoreManager.getUser(userId);
  let lastUpdated = user?.lastUpdated ?? 0;
  for await ( const score of fetchPlayerScore(userId) ) {
    if ( new Date(score.timeSet) < lastUpdated ) break;
    const accuracy = score.maxScore
      ? score.score * 100 / score.maxScore
      : void 0;
    await scoreManager.addScore({
      leaderboardId: score.leaderboardId,
      userId,
      score: score.score,
      pp: score.pp,
      accuracy,
    });
  }
  const scores = sortPPAsc(await scoreManager.getUserScore( userId ));
  scoreManager.updateUser({
    userId,
    lastUpdated: Date.now(),
    accumlatedScores: initAccumlatedScores( scores ),
  });
  console.log(`user scores have been updated.`);
}
