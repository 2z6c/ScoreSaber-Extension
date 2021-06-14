import { getMapByHash } from './integration/beatsaver';
import { pushStorage, readStorage, removeBookmark } from './storage';

export function addAction(tr,hash,link){
  const td = document.createElement('td');
  td.classList.add('action');
  tr.appendChild(td);
  addSongDownloadButton(td,hash);
  addBookmarkButton(td,hash,link);
}

export async function addSongDownloadButton(parent,hash) {
  parent.insertAdjacentHTML('beforeend',`
  <i
    class="fas fa-cloud-download-alt oneclick-install"
    role="button"
    title="OneClick Install"
    data-hash="${hash}"
  ></i>`);
  parent.querySelector('.oneclick-install').addEventListener('click',oneClickInstall);
}

export async function addBookmarkButton(parent,hash,link) {
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
    data-link="${link.split(/[#?]/g)[0]}"
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
    const link = button.dataset.link;
    await pushStorage('bookmark',{hash,title,link});
    button.classList.replace('far','fas');
    button.title = 'Remove Bookmark';
  }
}

/**
 * @param {MouseEvent} e
 */
async function oneClickInstall(e){
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

/**
 * 
 * @param {string} timestamp 
 * @returns {string}
 */
export function shortenTimestamp(timestamp){
  let [v,u] = timestamp.trim().split(' ');
  if ( u.startsWith('min') ) u = 'min';
  else u = u[0];
  return `${v}${u}`;
}

export function extractHash(text) {
  return text.match(/[0-9a-fA-F]{40}/)[0];
}

export async function waitElement(selector,parent=document) {
  let el = parent.querySelector(selector);
  let loop = 100;
  while ( !el && --loop > 0 ) {
    await new Promise(r=>setTimeout(r,250));
    el = parent.querySelector(selector);
  }
  return el;
}

export function postMessage(query) {
  return new Promise( resolve => {
    chrome.runtime.sendMessage( query, resolve );
  });
}