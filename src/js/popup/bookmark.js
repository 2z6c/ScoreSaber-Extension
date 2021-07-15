import {
  readStorage,
  removeBookmark,
  KEY_BOOKMARK
} from '../api/storage';
import { BASE_URL } from '../integration/scoresaber';
import { downloadJson, getExtensionImage } from '../util';
import { profileManager } from '../profileManager';
/**
 * @typedef {import('../api/storage').Bookmark} Bookmark
 */

export async function initBookmark() {
  /** @type {Bookmark[]} */
  const bookmarks = await readStorage(KEY_BOOKMARK);
  if ( !bookmarks ) return;
  const ul = document.getElementById('bookmark-song-list');
  const tmp = /** @type {HTMLTemplateElement} */ (document.getElementById('bookmark-item-template'));
  for ( const bookmark of bookmarks ) {
    const li = /** @type {HTMLElement} */ (tmp.content.cloneNode(true).firstChild);
    li.querySelector('.song-cover').setAttribute('src', `${BASE_URL}/imports/images/songs/${bookmark.hash}.png`);
    li.dataset.link = bookmark.link;
    li.addEventListener('click',openSongPage);
    const a = li.querySelector('.song-title');
    a.textContent = bookmark.title;
    // a.setAttribute('href',`${BASE_URL}/u/${bookmark.id}`);
    const button = /** @type {HTMLButtonElement} */ (li.querySelector('.remove-bookmark'));
    button.addEventListener('click', handleBookmark);
    button.dataset.hash = bookmark.hash;
    ul.appendChild(li);
  }
  const buttonDL = /** @type {HTMLButtonElement} */ (document.getElementById('download-as-playlist'));
  buttonDL.addEventListener('click',downloadPlaylist);
  if ( ul.childElementCount > 0 ) {
    ul.nextElementSibling.classList.add('hidden');
    buttonDL.disabled = false;
  }
}

/** @param {MouseEvent & {target:HTMLElement}} e */
function openSongPage(e) {
  let url = e.target.dataset.link;
  if ( url[0] === '/' ) url = BASE_URL + url;
  window.open( url, '_blank' );
}

/** @param {MouseEvent & {target:HTMLElement}} e */
async function handleBookmark(e) {
  e.stopPropagation();
  const button = e.target;
  /** @type {HTMLUListElement} */
  const ul = button.closest('ul');
  await removeBookmark( button.dataset.hash );
  button.closest('li').remove();
  if ( ul.childElementCount === 0 ) {
    document.getElementById('download-as-playlist').setAttribute('disabled','');
    ul.closest('section').querySelector('.hint').classList.remove('hidden');
  }
}

/** @param {MouseEvent & {target:HTMLButtonElement}} e */
async function downloadPlaylist(e) {
  const button = e.target;
  button.disabled = true;
  /** @type {import('../api/storage').Bookmark[]} */
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

