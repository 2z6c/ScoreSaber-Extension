import {
  // fetchRankedSongs,
  getLastUpdate,
  BASE_URL
} from './integration/scoresaber';
import { clearUserScores, downloadJson, postToBackground } from './util';
import { KEY_BOOKMARK, readStorage, removeBookmark, removeFavorite, writeStorage } from './storage';

async function setUser() {
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
  input.disabled = locked = user.locked;
  if ( locked ) {
    const lock = input.nextSibling;
    lock.title = 'Unlock';
    lock.querySelector('i').className = 'fas fa-lock';
  }
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
  await writeStorage('user', {
    id: input.value,
    name: data.playerInfo.playerName,
    avatar: `https://new.scoresaber.com${data.playerInfo.avatar}`,
    country: data.playerInfo.country.toLocaleLowerCase(),
    locked: true,
  });
  await clearUserScores();
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
    await postToBackground({getRanked: {difference:true}});
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
  const {id} = await readStorage('user');
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
  document.getElementById('deletion-state').textContent = 'Succeed to delete extension data.';
}

async function initFavorite() {
  /** @type {import('./storage').Favorite[]} */
  const favorites = await readStorage('favorite');
  if ( !favorites ) return;
  const ul = document.getElementById('favorite-player-list');
  const tmp = document.getElementById('favorite-item-template').content;
  for ( const fav of favorites ) {
    const li = tmp.cloneNode(true).firstElementChild;
    li.querySelector('.favorite-player-avator').src = fav.avatar;
    li.querySelector('.favorite-player-country').src = `${BASE_URL}/imports/images/flags/${fav.country}.png`;
    const a = li.querySelector('.favorite-player-name');
    a.textContent = fav.name;
    li.dataset.link = `${BASE_URL}/u/${fav.id}`;
    li.addEventListener('click',openUserPage);
    const button = li.querySelector('.remove-favorite');
    button.addEventListener('click', onClickRemoveFavorite);
    button.dataset.id = fav.id;
    ul.appendChild(li);
  }
  if ( favorites.length ) ul.nextSibling.classList.add('hidden');
}

/** @param {MouseEvent} e */
function openUserPage(e) {
  const link = e.currentTarget.dataset.link;
  window.open( link, '_blank' );
}

/** @param {MouseEvent} e */
async function onClickRemoveFavorite(e) {
  e.stopPropagation();
  const button = e.currentTarget;
  await removeFavorite( button.dataset.id );
  button.closest('li').remove();
}

async function initBookmark() {
  /** @type {import('./storage').Bookmark[]} */
  const bookmarks = await readStorage(KEY_BOOKMARK);
  if ( !bookmarks ) return;
  const ul = document.getElementById('bookmark-song-list');
  const tmp = document.getElementById('bookmark-item-template').content;
  for ( const bookmark of bookmarks ) {
    const li = tmp.cloneNode(true).firstElementChild;
    li.querySelector('.song-cover').src = `${BASE_URL}/imports/images/songs/${bookmark.hash}.png`;
    li.dataset.link = bookmark.link;
    li.addEventListener('click',openSongPage);
    const a = li.querySelector('.song-title');
    a.textContent = bookmark.title;
    // a.setAttribute('href',`${BASE_URL}/u/${bookmark.id}`);
    const button = li.querySelector('.remove-bookmark');
    button.addEventListener('click', handleBookmark);
    button.dataset.hash = bookmark.hash;
    ul.appendChild(li);
  }
  const buttonDL = document.getElementById('download-as-playlist');
  buttonDL.addEventListener('click',downloadPlaylist);
  if ( ul.childElementCount > 0 ) {
    ul.nextSibling.classList.add('hidden');
    buttonDL.disabled = false;
  }
}

/** @param {MouseEvent} e */
function openSongPage(e) {
  let url = e.currentTarget.dataset.link;
  if ( url[0] === '/' ) url = BASE_URL + url;
  window.open( url, '_blank' );
}

/** @type {MouseEvent} e */
async function handleBookmark(e) {
  e.stopPropagation();
  const button = e.currentTarget;
  /** @type {HTMLUListElement} */
  const ul = button.closest('ul');
  await removeBookmark( button.dataset.hash );
  button.closest('li').remove();
  if ( ul.childElementCount === 0 ) {
    document.getElementById('download-as-playlist').disabled = true;
    ul.closest('section').querySelector('.hint').classList.remove('hidden');
  }
}

/** @param {MouseEvent} e */
async function downloadPlaylist(e) {
  /** @type {HTMLButtonElement} */
  const button = e.currentTarget;
  button.disabled = true;
  downloadJson({
    playlistTitle: 'ScoreSaber Bookmark',
    playlistAuthor: (await readStorage('user'))?.name || 'ScoreSaber-Extension',
    image: await getExtensionImage(),
    songs: (await readStorage(KEY_BOOKMARK)).map(({hash})=>({hash})),
  });
  button.disabled = false;
}

async function getExtensionImage() {
  const IMG_SIZE = 48;
  const img = new Image(IMG_SIZE,IMG_SIZE);
  await new Promise( resolve => {
    img.src = `/icons/${IMG_SIZE}x${IMG_SIZE}.png`;
    img.addEventListener('load',resolve);
  });
  const canvas = document.createElement('canvas');
  canvas.width = IMG_SIZE;
  canvas.height = IMG_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

async function setupUpdateRankedSongsButton() {
  const button = document.getElementById('update-ranked-songs');
  button.addEventListener('click', updateRankList);
  document.getElementById('update-user-score').addEventListener('click',updateUserScores);
  let busy = await postToBackground({isBusy:true});
  if ( busy ) {
    button.disabled = true;
    let limit = 100;
    while ( busy && --limit ) {
      new Promise(r=>setTimeout(r,200));
      busy = (await postToBackground({isBusy:true}))?.busy;
    }
    button.disabled = false;
  }
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