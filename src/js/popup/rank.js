import { messageAPI } from '../api/message';
import { RankedSongManager } from '../db/rankedSongManager';
import { getLastUpdate } from '../integration/scoresaber';
import { profileManager } from '../profileManager';
import { downloadJson, getExtensionImage } from '../util';

const range = [
  /** @type {HTMLInputElement} */
  (document.getElementById('min-star-range')),
  /** @type {HTMLInputElement} */
  (document.getElementById('max-star-range')),
];
const number = [
  /** @type {HTMLInputElement} */
  (document.getElementById('min-star-number')),
  /** @type {HTMLInputElement} */
  (document.getElementById('max-star-number')),
];

range[0].addEventListener('change',e => {
  number[0].value = range[0].value;
  syncMin( range[0].value );
  countLevels();
});
range[1].addEventListener('change',e => {
  number[1].value = range[1].value;
  syncMax( range[1].value );
  countLevels();
});
number[0].addEventListener('change', e => {
  range[0].value = number[0].value;
  syncMin( number[0].value );
  countLevels();
});
number[1].addEventListener('change', e => {
  range[1].value = number[1].value;
  syncMax( number[1].value );
  countLevels();
});

function syncMin( min ) {
  // number[1].min = range[1].min = value;
  if ( parseFloat(number[1].value) < parseFloat(min) ) {
    number[1].value = range[1].value = min;
  }
}

function syncMax( max ) {
  // number[0].max = range[0].max = value;
  if ( parseFloat(number[0].value) > parseFloat(max) ) {
    number[0].value = range[0].value = max;
  }
}

const countMaps = document.getElementById('count-maps');
const countDiffs = document.getElementById('count-difficulties');
const rankedSongManager = new RankedSongManager();
const button = /** @type {HTMLButtonElement} */ (document.getElementById('download-starred-playlist'));

async function countLevels() {
  const star = [
    parseFloat(number[0].value),
    parseFloat(number[1].value)
  ];
  const [diffs,songs] = await rankedSongManager.countRange( star[0], star[1] );
  countDiffs.textContent = `${diffs}`;
  countMaps.textContent = `${songs}`;
  button.disabled = diffs === 0;
}
countLevels();

button.addEventListener('click',async e => {
  button.disabled = true;
  const star = [
    parseFloat(number[0].value),
    parseFloat(number[1].value)
  ];
  // if ( star[1] === 14 ) star[1] = Infinity;
  const list = await rankedSongManager.getRange( star[0], star[1] );
  // console.dir( list );
  downloadJson({
    playlistTitle: `ScoreSaber Ranked Pool ???${star[0].toFixed(1)} - ${star[1].toFixed(1)}`,
    playlistAuthor: (await profileManager.get())?.name || 'ScoreSaber-Extension',
    image: await getExtensionImage(),
    songs: makeSongItems( list ),
  }, `ranked pool ${star[0].toFixed(1)} - ${star[1].toFixed(1)}`);
  button.disabled = false;
});

/**
 * @param {import('../types/database').Level} level
 * @returns {import('../types/beatsaber').BeatSaber.PlaylistSong }
 */
// function makeSongItem(level) {
//   return {
//     hash: level.hash,
//     difficulties: [{
//       name: level.diff,
//       characteristic: 'Standard',
//     }]
//   };
// }
/**
 * make song list for playlist.json that removes duplicate
 * @param {import('../types/database').Level[]} levels
 * @returns {import('../types/beatsaber').BeatSaber.PlaylistSong[] }
 */
function makeSongItems( levels ) {
  const items = new Map();
  for ( const {hash,diff} of levels ) {
    const item = items.get(hash) ?? { hash, difficulties: [] };
    item.difficulties.push({
      name: diff.replace('+','Plus'),
      characteristic: 'Standard'
    });
    items.set( hash, item );
  }
  // console.log(items);
  return [...items.values()];
}

const checkboxHardReset = /** @type {HTMLInputElement} */ (document.getElementById('enable-hard-refresh'));

/** @param {MouseEvent & {target:HTMLButtonElement}} e */
async function updateRankList(e) {
  const button = e.target;
  button.disabled = true;
  const hard = checkboxHardReset.checked;
  try {
    await messageAPI.getRanked(!hard);
    showHint( 'update-rank-hint', 'Scceed to update.');
    await setLastUpdate();
  } catch(e) {
    console.error(e);
    showHint( 'update-rank-hint', 'Failed to update. Retry later.', 'error');
  } finally {
    button.disabled = false;
    checkboxHardReset.checked = false;
  }
}

function showHint( id, msg, type='' ) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `hint ${type}`;
}

const $lastUpdate = document.getElementById('last-update-date');
async function setLastUpdate() {
  const text = await getLastUpdate();
  $lastUpdate.textContent = text ? new Date(text).toLocaleString() : 'Now Loading...';
}
setLastUpdate();

document.getElementById('update-ranked-songs').addEventListener('click', updateRankList);
