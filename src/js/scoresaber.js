/**
 * @typedef {import('./types/scoresaber').ScoreSaber.Schema} Schema
 */

const LIMIT = 1000;
const RANK_URL = `https://scoresaber.com/api.php?function=get-leaderboards&limit=${LIMIT}&ranked=1&page=`
let rank = {};

export async function fetchRankedSongs() {
  for ( let i = 1;; i++ ) {
    console.log('fetch scoresaber ranked data. page ',i);
    try {
      const res = await fetch(RANK_URL + i);
      /** @type {Schema} */
      const data = await res.json();
      if ( data.songs.length === 0 ) break;
      for ( const {id,diff,stars} of data.songs ) {
        if ( !rank[id] ) rank[id] = {}
        rank[id][extructDifficulty(diff)] = stars;
      }
      await new Promise(r=>setTimeout(r, i * 3000));
    } catch(e) {
      console.error(e);
      break;
    }
  }
  console.log('fetch end.');
  chrome.storage.local.set({
    rank,
    lastUpdate: Date.now(),
  });
}

function readStorage(key) {
  return new Promise( resolve => {
    chrome.storage.local.get(key, items => {
      resolve(items[key]);
    });
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
