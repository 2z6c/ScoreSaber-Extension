/**
 * @typedef {import('./types/scoresaber').ScoreSaber.Schema} Schema
 */
import {readStorage} from './storage';

export const BASE_URL = 'https://scoresaber.com/';

const RANK_URL = (limit,page) => `${BASE_URL}api.php?function=get-leaderboards&cat=1&limit=${limit}&ranked=1&page=${page}`
let rank = {};

export async function fetchRankedSongs({difference=false}={}) {
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
