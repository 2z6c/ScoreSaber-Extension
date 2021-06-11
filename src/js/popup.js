import {
  // fetchRankedSongs,
  getLastUpdate,
  BASE_URL
} from './integration/scoresaber';
import { KEY_BOOKMARK, readStorage, removeBookmark, removeFavorite, writeStorage } from './storage';

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

async function initBookmark() {
  /** @type {import('./storage').Bookmark[]} */
  const bookmarks = await readStorage(KEY_BOOKMARK);
  if ( !bookmarks ) return;
  const ul = document.getElementById('bookmark-song-list');
  const tmp = document.getElementById('bookmark-item-template').content;
  let i = 0;
  for ( const bookmark of bookmarks ) {
    const li = tmp.cloneNode(true);
    li.querySelector('.song-cover').src = `${BASE_URL}/imports/images/songs/${bookmark.hash}.png`;
    const a = li.querySelector('.song-title');
    a.textContent = bookmark.title;
    // a.setAttribute('href',`${BASE_URL}/u/${bookmark.id}`);
    const button = li.querySelector('.remove-bookmark');
    button.addEventListener('click', handleBookmark);
    button.dataset.hash = bookmark.hash;
    ul.appendChild(li);
    i++;
  }
  const buttonDL = document.getElementById('download-as-playlist');
  buttonDL.addEventListener('click',downloadPlaylist);
  if ( i ) {
    ul.nextSibling.classList.add('hidden');
    buttonDL.disabled = false;
  }
}

/** @type {MouseEvent} e */
async function handleBookmark(e) {
  const button = e.currentTarget;
  /** @type {HTMLUListElement} */
  const ul = button.closest('ul');
  await removeBookmark( button.dataset.hash );
  button.closest('li').remove();
  if ( ul.innerHTML === '' ) {
    document.getElementById('download-as-playlist').disabled = true;
    ul.closest('section').querySelector('.hint').classList.remove('hidden');
  }
}

/** @param {MouseEvent} e */
async function downloadPlaylist(e) {
  /** @type {HTMLButtonElement} */
  const button = e.currentTarget;
  button.disabled = true;
  const songs = await readStorage(KEY_BOOKMARK);
  const playlist = {
    playlistTitle: 'ScoreSaber Bookmark',
    playlistAuthor: (await readStorage('user'))?.name || 'ScoreSaber-Extension',
    image: await getExtensionImage(),
    songs,
  };
  const blob = new Blob([JSON.stringify(playlist)]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = 'playlist.json';
  a.click();
  button.disabled = false;
  URL.revokeObjectURL(url);
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
  initBookmark();
});