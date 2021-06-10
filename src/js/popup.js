import {
  // fetchRankedSongs,
  getLastUpdate,
  BASE_URL
} from './scoresaber';
import { readStorage, removeFavorite, writeStorage } from './storage';

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
    // await fetchRankedSongs({difference:true});
    await new Promise( resolve => {
      chrome.runtime.sendMessage({getRanked: {difference:true}},resolve);
    });
    await setLastUpdate();
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

async function initFavorite() {
  const favorites = await readStorage('favorite');
  if ( !favorites ) return;
  console.log(favorites);
  const ul = document.getElementById('favorite-player-list');
  const tmp = document.getElementById('favorite-item-template').content;
  for ( const fav of favorites ) {
    const li = tmp.cloneNode(true);
    li.querySelector('.favorite-player-avator').src = fav.avatar;
    const a = li.querySelector('.favorite-player-name');
    a.textContent = fav.name;
    a.setAttribute('href',`${BASE_URL}/u/${fav.id}`);
    const button = li.querySelector('.remove-favorite');
    button.addEventListener('click', onClickRemoveFavorite);
    button.dataset.id = fav.id;
    ul.appendChild(li);
  }
  if ( favorites.length ) ul.nextSibling.classList.add('hidden');
}

/** @param {MouseEvent} e */
async function onClickRemoveFavorite(e) {
  const button = e.currentTarget;
  await removeFavorite( button.dataset.id );
  button.closest('li').remove();
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
  initFavorite();
});