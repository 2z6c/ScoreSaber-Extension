import {
  readStorage,
  removeBookmark,
  KEY_BOOKMARK
} from '../storage';
import { BASE_URL } from '../integration/scoresaber';
import { downloadJson } from '../util';
import { profileManager } from '../profileManager';
/**
 * @typedef {import('../storage').Bookmark} Bookmark
 */

export async function initBookmark() {
  /** @type {Bookmark[]} */
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
  /** @type {import('../storage').Bookmark[]} */
  const bookmarks = await readStorage(KEY_BOOKMARK);
  downloadJson({
    playlistTitle: 'ScoreSaber Bookmark',
    playlistAuthor: (await profileManager.get())?.name || 'ScoreSaber-Extension',
    image: await getExtensionImage(),
    songs: bookmarks.map(makeSongItem),
  });
  button.disabled = false;
}

/**
 * @param {Bookmark} song
 * @returns {import('../types/beatsaber').BeatSaber.PlaylistSong }
 */
function makeSongItem(song) {
  const item = {
    hash: song.hash,
    songName: song.title,
  };
  if ( song.difficultyName ) {
    item.difficulties = [{
      name: song.difficultyName,
      characteristic: song.characteristic,
    }];
  }
  return item;
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