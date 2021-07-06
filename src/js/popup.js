import {
  // fetchRankedSongs,
  getLastUpdate,
  BASE_URL
} from './integration/scoresaber';
import { postToBackground } from './util';
import { initBookmark } from './popup/bookmark';
import { initFavorite } from './popup/favorite';
import { profileManager } from './profileManager';

async function setUser() {
  const user = await profileManager.get();
  if ( !user ) {
    document.getElementById('player-info').classList.add('hidden');
    return;
  }
  /** @type {HTMLInputElement} */
  const input = document.getElementById('user-id');
  const a = document.getElementById('user-name');
  a.textContent = user.name;
  a.setAttribute('href',`${BASE_URL}/u/${user.id}`);
  document.getElementById('avatar').src = user.avatar;
  document.getElementById('country-flag').src = `${BASE_URL}/imports/images/flags/${user.country}.png`;
  input.value = user.id;
  input.disabled = locked = user.locked;
  if ( locked ) {
    const lock = input.nextSibling;
    lock.title = 'Unlock';
    lock.querySelector('i').className = 'fas fa-lock';
  }
}

let locked = false;
/** @param {MouseEvent} e */
async function toggleLock(e) {
  locked = await profileManager.lock();
  const button = e.currentTarget;
  button.title = locked ? 'Unlock' : 'Lock';
  const i = button.querySelector('i');
  i.className = 'fas ' + (locked?'fa-lock':'fa-lock-open');
  const input = button.previousSibling;
  input.disabled = locked;
}

/** @param {MouseEvent} e */
async function onChangedUserID(e) {
  /** @type {HTMLInputElement} */
  const input = e.currentTarget;
  if ( !/^\d+$/.test(input.value) ) {
    showHint( 'user-id-hint', 'Invalid user ID.', 'error' );
    return;
  }
  const res = await fetch(`https://new.scoresaber.com/api/player/${input.value}/full`);
  /** @type {import('./types/scoresaber').ScoreSaber.Player} */
  const data = await res.json();
  if ( !data || data.error ) {
    showHint( 'user-id-hint', 'User not found.', 'error' );
    return;
  }
  await profileManager.set({
    id: input.value,
    name: data.playerInfo.playerName,
    avatar: `https://new.scoresaber.com${data.playerInfo.avatar}`,
    country: data.playerInfo.country.toLocaleLowerCase(),
    locked: true,
  });
  setUser();
}

function showHint( id, msg, type='' ) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `hint ${type}`;
}

async function setLastUpdate() {
  const b = document.getElementById('last-update-date');
  const text = await getLastUpdate();
  b.textContent = text ? new Date(text).toLocaleString() : 'Now Loading...';
}

/** @param {MouseEvent} e */
async function updateRankList(e) {
  /** @type {HTMLButtonElement} */
  const button = e.currentTarget;
  button.disabled = true;
  try {
    await postToBackground({getRanked: {incremental:true}});
    showHint( 'update-rank-hint', 'Scceed to update.');
    await setLastUpdate();
  } catch(e) {
    console.error(e);
    showHint( 'update-rank-hint', 'Failed to update. Retry later.', 'error');
  } finally {
    button.disabled = false;
  }
}

/** @param {MouseEvent} e */
async function updateUserScores(e) {
  /** @type {HTMLButtonElement} */
  const button = e.currentTarget;
  button.disabled = true;
  const {id} = await profileManager.get();
  try {
    await postToBackground({updateScores: {id}});
    showHint( 'update-scores-hint', 'Scceed to update.');
    await setLastUpdate();
  } catch(e) {
    console.error(e);
    showHint( 'update-scores-hint', 'Failed to update. Retry later.', 'error');
  } finally {
    button.disabled = false;
  }
}

/** @param {MouseEvent} e */
function changeTab(e) {
  document.querySelectorAll('.active').forEach(el=>{
    el.classList.remove('active');
  });
  const tab = e.currentTarget;
  tab.classList.add('active');
  document.getElementById(tab.title).classList.add('active');
}

/** @param {MouseEvent} e */
async function deleteStorageData(e) {
  e.currentTarget.disabled = true;
  await new Promise(resolve=>{
    chrome.storage.local.clear(()=>{
      resolve();
    });
  });
  await postToBackground({deleteDB:true});
  document.getElementById('deletion-state').textContent = 'Succeed to delete extension data.';
}

async function setupUpdateRankedSongsButton() {
  const button = document.getElementById('update-ranked-songs');
  button.addEventListener('click', updateRankList);
  document.getElementById('update-user-score').addEventListener('click',updateUserScores);
  setLastUpdate();
}

window.addEventListener('load',()=>{
  document.getElementById('user-id').addEventListener('change',onChangedUserID);
  document.getElementById('lock-user-id').addEventListener('click',toggleLock);
  setUser();
  setupUpdateRankedSongsButton();
  document.getElementById('clear-all-data').addEventListener('click',deleteStorageData);
  document.querySelectorAll('.tab').forEach(el=>{
    el.addEventListener('click',changeTab);
  });
  initFavorite();
  initBookmark();
});