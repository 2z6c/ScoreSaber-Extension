import {
  addAction,
  clearUserScores,
  postToBackground,
  getAccracyRank,
} from './util.js';
import { getSongStars, loadRankedSongs } from './integration/scoresaber';
import { pushStorage, readStorage, removeFavorite, writeStorage } from './storage.js';
import { snipe } from './snipe.js';

const UID = location.pathname.match(/\d+/)[0];

function getUserName() {
  const title = document.getElementsByTagName('title')[0];
  return title.textContent.replace(/'s profile \| ScoreSaber!$/, '');
}

function getPP() {
  const pp = document.querySelector('meta[property="og:description"]').content.split('\n')[1];
  return pp.replace(/[^0-9,.]/g, '').replace(',','%2c');
}

function changeRankingLink(selector) {
  const a = document.querySelector(selector);
  const textRank = a.textContent.trim();
  const rank = textRank.replace(/[^\d]/g,'')|0;
  const href = new URL(a.getAttribute('href'), location.origin);
  href.pathname += `/${Math.ceil(rank/50)}`;
  const highlight = textRank.replace(',','%2c');
  a.setAttribute('href',`${href}#:~:text=${highlight},${getPP()}pp`);
}

function changeSongRankingLink(tr) {
  const a = tr.querySelector('a');
  const textRank = tr.querySelector('.rank').textContent.trim();
  const pp = tr.querySelector('.ppValue').textContent + 'pp';
  const rank = textRank.replace(/[^\d]/g,'')|0;
  const href = new URL(a.getAttribute('href'), location.origin);
  href.searchParams.append('page', Math.ceil(rank/12));
  const highlight = textRank.replace(',','%2c');
  a.setAttribute('href',`${href}#:~:text=${highlight},${pp}`);
}

async function addButtonSetPlayer() {
  const locked = (await readStorage('user'))?.locked;
  const title = document.querySelector('.title a');
  addSnipeButton(title);
  addFavoriteButton(title);
  title.insertAdjacentHTML('afterend',`
  <i
    id="button-set-my-account"
    class="far fa-id-badge ${locked?'hidden':''}"
    role="button"
    title="Set to My Profile."
  ></i>
  `);
  title.nextElementSibling.addEventListener('click',setMyAccount);
  title.insertAdjacentHTML('afterend',`
  <i
    id="button-unset-my-account"
    class="fas fa-id-badge  ${locked?'hidden':''}"
    role="button"
    title="Unset My Profile."
  ></i>
  `);
  title.nextElementSibling.addEventListener('click',unsetMyAccount);
}

async function setMyAccount(e) {
  await writeStorage('user', {
    id: UID,
    name: getUserName(),
    avatar: document.querySelector('.avatar > img').src,
    country: document.querySelector('a[href*="country"]').href.match(/(?<=country=)../)[0],
    locked: true,
  });
  await clearUserScores();
  e.target.closest('h5').classList.add('my-account');
}

async function addFavoriteButton(title) {
  const fav = await readStorage('favorite');
  const isFav = fav?.some(f=>f.id === UID);
  title.insertAdjacentHTML('afterend',`
  <i
    id="button-add-favorite"
    class="${isFav?'fas':'far'} fa-heart"
    role="button"
    title="Add my favorite."
  ></i>
  `);
  title.nextElementSibling.addEventListener('click',handleFavorite);
}

function addSnipeButton(title) {
  title.insertAdjacentHTML('afterend',`
  <i
    id="button-snipe"
    class="fas fa-crosshairs"
    role="button"
    title="Snipe ${title.textContent.trim()}."
  ></i>`);
  title.nextElementSibling.addEventListener('click',async ()=>{
    await snipe(UID);
  });
}

/** @param {MouseEvent} e */
async function handleFavorite(e) {
  const isFav = (await readStorage('favorite'))?.some(f=>f.id === UID);
  if ( isFav ) {
    await removeFavorite( UID );
    e.target.classList.replace('fas','far');
  } else {
    await pushStorage('favorite',{
      id: UID,
      name: getUserName(),
      avatar: document.querySelector('.avatar > img').src,
      country: document.querySelector('a[href*="country"]').href.match(/(?<=country=)../)[0],
    });
    e.target.classList.replace('far','fas');
  }
}

function unsetMyAccount(e) {
  chrome.storage.local.remove('user');
  e.target.closest('h5').classList.remove('my-account');
}

function checkMyAccount() {
  const id = UID;
  chrome.storage.local.get('user',({user})=>{
    if ( user?.id === id ) document.querySelector('.title.is-5').classList.add('my-account');
  });
}

function addButtonExpandChart() {
  const chart = document.querySelector('.rankChart');
  chart.insertAdjacentHTML('afterbegin',`
  <i
    class="fas fa-expand button-chart-expand"
    role="button"
    title="expand chart"
  ></i>
  `);
  const i = chart.querySelector('i');
  i.addEventListener('click',expandChart);
}

let isChartExpanded = false;
/**
 * @param {MouseEvent} e
 */
function expandChart(e) {
  const i = e.currentTarget;
  const chart = i.parentNode;
  chart.style.height = isChartExpanded?'':'500px';
  isChartExpanded = !isChartExpanded;
  if ( isChartExpanded ) i.classList.replace('fa-expand','fa-compress');
  else i.classList.replace('fa-compress','fa-expand');
}

/**
 * @param {HTMLTableRowElement} tr
 */
function moveMapper(tr) {
  const mapper = tr.querySelector('.mapper');
  const title = tr.querySelector('a');
  tr.querySelector('br').remove();
  const a = document.createElement('a');
  a.insertAdjacentHTML('afterbegin','<i class="fas fa-user-edit mapper-icon" title="Mapper"></i>');
  a.appendChild(mapper);
  a.setAttribute('href',`/?search=${encodeURIComponent(mapper.textContent.trim())}`);
  const div = document.createElement('div');
  div.appendChild(a);
  title.insertAdjacentElement('afterend',div);

  const d = tr.querySelector(`.time`);
  div.appendChild(d);
}

function addAccracyRank(tr){
  const acc = tr.querySelector('.scoreBottom');
  const value = parseFloat(acc.textContent.match(/\d+\.?\d*(?=%)/)?.[0]);
  if ( !value ) return;
  acc.textContent = `${value.toFixed(2)}%`;
  acc.insertAdjacentHTML('afterbegin',createAccuracyBadge(value));
}

function createAccuracyBadge( accuracy ) {
  const rating = getAccracyRank( accuracy );
  return `<i
    class="accuracy-rank-badge rank-${rating}"
  >${rating}</i>`;
}

const makeDifficultyLabel = (text,color,star) => `
<td>
  <div class="difficulty-label" style="background:${color}">
    <div>${text}</div>
    <div ${star?'':'hidden'}><i class="fas fa-star"></i>${star?.toFixed(2)}</div>
  </div>
</td>`;

function modifyPP(tr) {
  const score = tr.querySelector('.score');
  const regex = /[0-9.]+(?=pp)/gi;
  const rawPP = regex.exec(score.textContent)[0];
  const weightedPP = regex.exec(score.textContent)[0];
  const w = weightedPP * 100 / rawPP;
  const br = score.querySelector('.scoreBottom');
  while ( br.previousElementSibling ) br.previousElementSibling.remove();
  br.insertAdjacentHTML('beforebegin',`
  <div
    class="scoreTop"
    style="border-image-source:linear-gradient(90deg,gold,gold ${w}%,gray ${w}%,gray);"
  >
    <span class="raw-pp">${rawPP}pp</span>
    <span class="weighted-pp">${weightedPP}pp</span>
  </div>`);
}

// function makeGradient(value) {
//   const direction = (value>0) ? '80deg' : '260deg';
//   const color = (value>0) ? 'lightgreen' : 'pink';
//   return `linear-gradient(
//     ${direction},
//     ${color}, ${color}, ${Math.abs(value)}%,
//     transparent ${Math.abs(value)}%, transparent
//   )`;
// }

async function addComparison(tr) {
  const leaderboardId = new URL(tr.querySelector('.song a').href).pathname.split('/').pop() | 0;
  const {id: userId} = await readStorage('user');
  const targetPP = parseFloat(/[\d.]+(?=pp)/.exec(tr.querySelector('.score').textContent));
  const score = await postToBackground({getScore: {leaderboardId, userId}});
  tr.querySelector('.score').insertAdjacentHTML('afterend', await createMyScore(score,leaderboardId,targetPP));
  /*
  if ( !score ) {
    tr.style.backgroundImage = makeGradient(-100);
    return;
  }
  let ratio = 0;
  const targetScoreText = tr.querySelector('.scoreBottom').textContent;
  if ( /score:/.test(targetScoreText) ) {
    const targetScore = parseInt(/[\d,]+(?=\.)/.exec(targetScoreText)[0].replace(/,/g,''));
    ratio = score.score / targetScore;
  } else {
    const targetPP = parseFloat(/[\d.]+(?=pp)/.exec(tr.querySelector('.score').textContent));
    ratio = score.pp / targetPP;
  }
  ratio -= 1.0;
  if ( ratio > 1 ) ratio = 1;
  else if ( ratio < -1 ) ratio = -1;
  tr.style.backgroundImage = makeGradient(ratio * 100);
  */
}

/**
 * @param {import('./types/database').SongScore|void} score
 * @param {number} targetPP
 */
async function createMyScore(score,leaderboardId,targetPP) {
  const accuracy = score?.accuracy;
  let comp = 0;
  if ( targetPP && (score?.pp??0) < targetPP ) {
    comp = await postToBackground({predictScore:{
      leaderboardId,
      pp: targetPP,
    }});
    comp = Math.round( comp * 100 ) / 100;
  }
  const pp = score ? Math.round(score.pp * 100) / 100: 0;
  return `
  <td class="score">
    <div
      class="scoreTop"
    >
      <span class="raw-pp">${pp.toFixed(2)}pp</span>
      <span
        class="weighted-pp"
        title="The predicted PP you will get if you achieve the same score."
      >+${comp.toFixed(2)}pp</span>
    </div>
    <span class="scoreBottom">
      ${accuracy?createAccuracyBadge(accuracy):''}
      ${accuracy?accuracy.toFixed(2)+'%':'score: '+(score?.score??0).toLocaleString()}
    </span>
  </td>`;
}

function arrangeScoreTable() {
  const tr = document.querySelectorAll('.ranking.songs tr');
  tr[0].insertAdjacentHTML('beforeend','<th>My Score</th>');
  tr[0].insertAdjacentHTML('beforeend','<th>Action</th>');
  for ( let i = 1; i < tr.length; i++ ) {
    const hash = tr[i].querySelector('img').src.match(/[0-9a-fA-F]{40}/)[0];

    const dif = tr[i].querySelector('span[style^="color"]');
    const diffText = dif.textContent.trim();
    const star = getSongStars(hash,diffText);
    dif.closest('div').insertAdjacentHTML('beforebegin',makeDifficultyLabel(diffText,dif.style.color,star));
    dif.remove();
    // modifyTimestamp(tr[i]);
    moveMapper(tr[i]);
    modifyPP(tr[i]);
    addAccracyRank(tr[i]);
    const link = tr[i].querySelector('a').href;
    addAction(tr[i],hash,link);
    addComparison(tr[i]);
  }
}

const SORT_TYPE = ['','Top Scores','Recent Scores'];
function modifyTableSorter() {
  const select = document.querySelector('.select');
  const currentSortType = new URLSearchParams(location.search).get('sort') || 1;
  select.insertAdjacentHTML('beforebegin',`
  <div id="score-header">
    <h2>${SORT_TYPE[currentSortType]}</h2>
    <a href="${UID}?sort=${3-currentSortType}">
      <i class="fas fa-angle-right"></i>
      ${SORT_TYPE[3-currentSortType]}
    </a>
  </div>
  `);
  select.remove();
}

function fixPagenation() {
  const links = document.querySelectorAll('.pagination a');
  for ( const a of links ) {
    a.href = a.href.replace('&','?');
  }
}

async function init() {
  await loadRankedSongs();
  checkMyAccount();
  changeRankingLink('a[href="/global"]');
  changeRankingLink('a[href^="/global?country="]');
  const trs = document.querySelectorAll('.ranking.songs tbody tr');
  for ( const tr of trs ) {
    changeSongRankingLink(tr);
  }
  addButtonSetPlayer();
  addButtonExpandChart();
  arrangeScoreTable();
  modifyTableSorter();
  fixPagenation();
}

if ( document.readyState === 'loading' ) {
  document.addEventListener('DOMContentLoaded',init);
} else {
  init();
}