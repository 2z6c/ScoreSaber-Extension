import {
  getLastUpdate,
} from './integration/scoresaber';
import { postToBackground } from './util';
import { initBookmark } from './popup/bookmark';
import { initFavorite } from './popup/favorite';
import { FormProfile } from './popup/profile';

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
  setLastUpdate();
}

window.addEventListener('load',()=>{
  const profile = new FormProfile();
  profile.render();
  setupUpdateRankedSongsButton();
  document.getElementById('clear-all-data').addEventListener('click',deleteStorageData);
  document.querySelectorAll('.tab').forEach(el=>{
    el.addEventListener('click',changeTab);
  });
  initFavorite();
  initBookmark();
});