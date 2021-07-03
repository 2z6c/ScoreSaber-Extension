import { BEATSAVER_API, getMapByHash } from './integration/beatsaver';
import { bookmark } from './bookmarkManager';

export const sleep = ms => new Promise(r=>setTimeout(r,ms));

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
  return label.replace('+','Plus');
}

/** @param {MouseEvent} e */
async function handleBookmark(e) {
  /** @type {HTMLButtonElement} */
  const button = e.currentTarget;
  const {hash, link} = button.dataset;
  const isBookmarked = button.classList.contains('fas');
  if ( isBookmarked ) {
    await bookmark.remove(hash);
    button.classList.replace('fas','far');
    button.title = 'Add Bookmark';
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
  return text.match(/[0-9a-fA-F]{40}/)?.[0];
}

export async function waitElement(selector,parent=document) {
  let el = parent.querySelector(selector);
  let loop = 100;
  while ( !el && --loop > 0 ) {
    await sleep(250);
    el = parent.querySelector(selector);
  }
  return el;
}

export function postToBackground(query) {
  return new Promise( resolve => {
    chrome.runtime.sendMessage( query, resolve );
  });
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

export function getAccracyRank( accuracy ) {
  if ( accuracy === 100.0 ) return 'SSS';
  else if ( accuracy >= 90.0 ) return 'SS';
  else if ( accuracy >= 80.0 ) return 'S';
  else if ( accuracy >= 65.0 ) return 'A';
  else if ( accuracy >= 50.0 ) return 'B';
  else if ( accuracy >= 35.0 ) return 'C';
  else if ( accuracy >= 20.0 ) return 'D';
  return 'E';
}

/**
 * @param {string} text Difficulty label
 * @param {string} color Color code of label (refer to original label)
 * @param {number} [star] Star Rank
 * @returns {string} HTML string
 */
export const makeDifficultyLabel = (text,color,star) => `
<div class="difficulty-label" style="background:${color}">
  <div>${text}</div>
  <div ${star?'':'hidden'}><i class="fas fa-star"></i>${star?.toFixed(2)}</div>
</div>`;

/**
 * @param {import('./types/database').SongScore|void} score
 * @param {number} targetPP
 */
export async function createMyScore(score,leaderboardId,targetPP) {
  const accuracy = score?.accuracy;
  let gain = 0;
  if ( targetPP && (score?.pp??0) < targetPP ) {
    gain = await postToBackground({predictScore:{
      leaderboardId,
      pp: targetPP,
    }});
    gain = Math.round( gain * 100 ) / 100;
  }
  const pp = score ? (Math.round(score.pp * 100) / 100).toFixed(2)+'pp': 'N/A';
  return `
  <div>
    <div
      class="scoreTop"
    >
      <span class="user-pp">${pp}</span>
      <span
        class="predicted-pp"
        title="The predicted PP you will get if you achieve the same score."
      >+${gain.toFixed(2)}pp</span>
    </div>
    <span class="scoreBottom">
      ${accuracy?createAccuracyBadge(accuracy):''}
      ${accuracy?accuracy.toFixed(2)+'%':score?score.score.toLocaleString():'N/A'}
    </span>
  </div>`;
}

export function createAccuracyBadge( accuracy ) {
  const rating = getAccracyRank( accuracy );
  return `<i
    class="accuracy-rank-badge rank-${rating}"
  >${rating}</i>`;
}