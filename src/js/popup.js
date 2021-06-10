import { fetchRankedSongs, getLastUpdate, BASE_URL } from './scoresaber';
import { readStorage, writeStorage } from './storage';
import { openLink } from './popup/util';

async function setUserID() {
  const user = await readStorage('user');
  if ( !user ) {
    document.getElementById('player-info').classList.add('hidden');
    return;
  }
  /** @type {HTMLInputElement} */
  const input = document.getElementById('user-id');
  const a = document.getElementById('user-name');
  a.textContent = user.name;
  a.setAttribute('href',`${BASE_URL}/u/${user.id}`);
  a.addEventListener('click',openLink);
  document.getElementById('avatar').src = user.avatar;
  document.getElementById('country-flag').src = `${BASE_URL}/imports/images/flags/${user.country}.png`;
  input.value = user.id;
  locked = user.locked;
  if ( !locked ) input.nextSibling.click();
}

let locked = false;
/** @param {MouseEvent} e */
function toggleLock(e) {
  locked = !locked;
  const button = e.currentTarget;
  button.title = locked ? 'Unlock' : 'Lock';
  const i = button.querySelector('i');
  i.className = 'fas ' + (locked?'fa-lock':'fa-lock-open');
  const input = button.previousSibling;
  writeStorage('user.locked',locked);
  input.disabled = locked;
}

async function setLastUpdate() {
  const b = document.getElementById('last-update-date');
  b.textContent = new Date(await getLastUpdate()).toLocaleString();
}

/** @param {MouseEvent} e */
async function updateRankList(e) {
  /** @type {HTMLButtonElement} */
  const button = e.currentTarget;
  button.disabled = true;
  try {
    await fetchRankedSongs({difference:true});
  } catch(e) {
    console.error(e);
    button.parentNode.querySelector('.error').textContent = 'Failed to update. Retry later.';
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
  document.getElementById('deletion-state').textContent = 'Succeed to delete extension data.';
}

window.addEventListener('load',()=>{
  document.getElementById('lock-user-id').addEventListener('click',toggleLock);
  setUserID();
  setLastUpdate();
  document.getElementById('update-ranked-songs').addEventListener('click', updateRankList);
  document.getElementById('clear-all-data').addEventListener('click',deleteStorageData);
  document.querySelectorAll('.tab').forEach(el=>{
    el.addEventListener('click',changeTab);
  });
});