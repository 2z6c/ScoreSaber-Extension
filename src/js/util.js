import { BEATSAVER_API, getMapByHash } from './integration/beatsaver';
import { bookmark } from './bookmarkManager';
import { Toast } from './toast';

/**
 * @typedef {import('./types/storage').DifficultyName} DifficultyName
 */

export const sleep = ms => new Promise(r=>setTimeout(r,ms));

/**
 * @param {Element} tr
 * @param {string} hash
 * @param {string} link
 */
export function addAction(tr,hash,link){
  const td = document.createElement('td');
  td.classList.add('action');
  tr.appendChild(td);
  addSongDownloadButton(td,hash);
  addBookmarkButton(td,hash,link);
}

/**
 * @param {HTMLElement} parent
 * @param {string} hash
 */
export async function addSongDownloadButton(parent,hash) {
  parent.insertAdjacentHTML('beforeend',`
  <i
    class="fas fa-cloud-download-alt oneclick-install"
    role="button"
    title="OneClick Install"
    data-hash="${hash}"
  ></i>`);
  parent.querySelector('.oneclick-install').addEventListener('click',oneClickInstall);
  parent.insertAdjacentHTML('beforeend',`
  <a
    href="${BEATSAVER_API}/download/hash/${hash.toLowerCase()}"
    role="button"
    download
  >
    <i
      class="far fa-file-archive"
      title="Download Zip File"
    ></i>
  </a>`);
}

/**
 * @param {HTMLElement} parent
 * @param {string} hash
 * @param {string} link
 */
export async function addBookmarkButton(parent,hash,link) {
  const isBookmarked = await bookmark.contains(hash);
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

/**
 * @param {HTMLElement} el
 */
function getDifficultyName(el) {
  let label = '';
  if ( location.pathname.startsWith('/u/') ) {
    label = el.closest('tr').querySelector('.difficulty-label').textContent.trim().split('\n')[0];
  } else if ( location.pathname.startsWith('/leaderboard/') ) {
    label = document.querySelector('.is-active').textContent;
  }
  return /** @type {DifficultyName} */ (label.replace('+','Plus'));
}

/** @param {MouseEvent & {target: HTMLButtonElement}} e */
async function handleBookmark(e) {
  const button = e.target;
  const {hash, link} = button.dataset;
  const isBookmarked = button.classList.contains('fas');
  if ( isBookmarked ) {
    await bookmark.remove(hash);
    button.classList.replace('fas','far');
    button.title = 'Add Bookmark';
    Toast.push(`"${button.dataset.title}" has been removed from your bookmark.`);
  } else {
    let title = button.dataset.title;
    if ( !title ) {
      const map = await getMapByHash(hash);
      title = map.metadata.songName;
      button.dataset.title = title;
    }
    await bookmark.add({
      hash, title, link,
      characteristic: 'Standard',
      difficultyName: getDifficultyName(button),
    });
    button.classList.replace('far','fas');
    button.title = 'Remove Bookmark';
    Toast.push(`"${title}" has been added to your bookmark.`);
  }
}

/**
 * @param {MouseEvent & {target:HTMLElement}} e
 */
async function oneClickInstall(e){
  const button = e.target;
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

export function extractHash(text) {
  return text.match(/[0-9a-fA-F]{40}/)?.[0];
}

/**
 * @param {string} selector
 * @param {Document|Element} parent
 * @returns {Promise<Element>}
 */
export async function waitElement(selector,parent=document) {
  let el = parent.querySelector(selector);
  let loop = 100;
  while ( !el && --loop > 0 ) {
    await sleep(250);
    el = parent.querySelector(selector);
  }
  return el;
}

export function connectToBackground(name, query) {
  const port = chrome.runtime.connect({name});
  port.postMessage({query});
  return port;
}

export function downloadJson( obj, filename='playlist' ) {
  const blob = new Blob([JSON.stringify(obj)]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = safeName`${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(s,...a) {
  return a.reduce((o,t,i)=>o+t+s[i+1],s[0]).replace(/[/\\:*?<>|]/g,'_');
}

export const formatter = {
  integer: new Intl.NumberFormat('en',{
    minimumFractionDigits: 0,
  }),
  fraction: new Intl.NumberFormat('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }),
  percent: new Intl.NumberFormat('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'percent',
  }),
  signedFraction: new Intl.NumberFormat('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }),
  signedPercent: new Intl.NumberFormat('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'percent',
    signDisplay: 'exceptZero',
  }),
  toInteger(v) {
    return formatter.integer.format(v);
  },
  toFraction(v) {
    v = Math.round( v * 100 ) / 100;
    return formatter.fraction.format(v);
  },
  toPercent(v) {
    return formatter.percent.format( Math.round(v*100) / 1e4 );
  },
  toSignedFraction(v) {
    v = Math.round( v * 100 ) / 100;
    return formatter.signedFraction.format(v);
  },
  toSignedPercent(v) {
    return formatter.signedPercent.format( Math.round(v*100) / 1e4 );
  }
};