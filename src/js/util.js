import { getMapByHash } from './integration/beatsaver';
import { pushStorage, readStorage, removeBookmark } from './storage';

export const makeDLLink = (hash) => `
<i
  class="fas fa-cloud-download-alt oneclick-install"
  role="button"
  title="OneClick Install"
  data-hash="${hash}"
></i>`;

export function addOperation(tr,hash){
  const td = document.createElement('td');
  // const hash = tr.querySelector('img').src.match(/[0-9A-F]{40}/)[0];
  tr.appendChild(td);
  td.insertAdjacentHTML('beforeend',makeDLLink(hash));
  td.querySelector('.oneclick-install').addEventListener('click',oneClickInstall);
  addBookmarkButton(td,hash);
}

async function addBookmarkButton(parent,hash) {
  /** @type {import('./types/storage').Bookmark[]} */
  const bookmark = await readStorage('bookmark');
  const index = bookmark.findIndex(v=>v.hash===hash);
  const isBookmarked = index >= 0;
  parent.insertAdjacentHTML('beforeend',`
  <i
    class="${isBookmarked?'fas':'far'} fa-bookmark"
    role="button"
    title="${isBookmarked?'Remove':'Add'} Bookmark"
    data-hash="${hash}"
  ></i>`);
  parent.querySelector('.fa-bookmark').addEventListener('click',handleBookmark);
}

/** @param {MouseEvent} e */
async function handleBookmark(e) {
  /** @type {HTMLButtonElement} */
  const button = e.currentTarget;
  const hash = button.dataset.hash;
  const isBookmarked = button.classList.contains('fas');
  if ( isBookmarked ) {
    await removeBookmark(hash);
    button.classList.replace('fas','far');
    button.title = 'Add Bookmark';
  } else {
    let title = button.dataset.title;
    if ( !title ) {
      const map = await getMapByHash(hash);
      title = map.metadata.songName;
      button.dataset.title = title;
    }
    await pushStorage('bookmark',{hash,title});  
    button.classList.replace('far','fas');
    button.title = 'Remove Bookmark';
  }
}

/**
 * @param {MouseEvent} e
 */
export async function oneClickInstall(e){
  /** @type {HTMLElement} */
  const button = e.currentTarget;
  const hash = button.dataset.hash;
  if ( !hash ) return;
  // button.disabled = true;
  const key = (await getMapByHash(hash))?.key;
  if ( !key ) {
    console.error('cannot get map key.');
    return;
  }
  window.open(`beatsaver://${key}`);
  // button.disabled = false;
}