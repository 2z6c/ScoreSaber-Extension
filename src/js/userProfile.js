import {addAction} from './util.js';
import {getSongStars, loadRankedSongs} from './integration/scoresaber';
import { pushStorage, readStorage, removeFavorite } from './storage.js';

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
  addFavoriteButton(title);
  title.insertAdjacentHTML('afterend',`
  <i
    id="button-set-my-account"
    class="far fa-id-badge"
    role="button"
    title="Set to My Account."
    ${locked?'hidden':''}
  ></i>
  `);
  title.nextElementSibling.addEventListener('click',setMyAccount);
  title.insertAdjacentHTML('afterend',`
  <i
    id="button-unset-my-account"
    class="fas fa-id-badge"
    role="button"
    title="Unset My Account."
  ></i>
  `);
  title.nextElementSibling.addEventListener('click',unsetMyAccount);
}

function setMyAccount(e) {
  const user = {
    id: UID,
    name: getUserName(),
    avatar: document.querySelector('.avatar > img').src,
    country: document.querySelector('a[href*="country"]').href.match(/(?<=country=)../)[0],
    locked: true,
  }
  chrome.storage.local.set({user});
  e.target.closest('h5').classList.add('my-account');
}

async function addFavoriteButton(title) {
  const fav = await readStorage('favorite');
  const isFav = fav.some(f=>f.id === UID);
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

/** @param {MouseEvent} e */
async function handleFavorite(e) {
  const isFav = (await readStorage('favorite')).some(f=>f.id === UID);
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
  a.insertAdjacentHTML('afterbegin','<i class="fas fa-user-edit mapper-icon" title="Mapper"></i>')
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
  // const td = acc.closest('th');
  // td.insertAdjacentHTML('afterbegin',`<div class="parcentage-bar" style="width:${value}%"></div>`);
  let rating = 'E';
  if ( value === 100.0 ) rating = 'SSS';
  else if ( value >= 90.0 ) rating = 'SS';
  else if ( value >= 80.0 ) rating = 'S';
  else if ( value >= 65.0 ) rating = 'A';
  else if ( value >= 50.0 ) rating = 'B';
  else if ( value >= 35.0 ) rating = 'C';
  else if ( value >= 20.0 ) rating = 'D';
  acc.insertAdjacentHTML('afterbegin',`
  <i
    class="accuracy-rank-badge rank-${rating}"
  >${rating}</i>`);
}

const makeDifficultyLabel = (text,color,star) => `
<td>
  <div class="difficulty-label" style="background:${color}">
    <div>${text}</div>
    <div ${star?'':'hidden'}><i class="fas fa-star"></i>${star?.toFixed(2)}</div>
  </div>
</td>`;

function arrangeScoreTable() {
  const tr = document.querySelectorAll('.ranking.songs tr');
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
    addAccracyRank(tr[i]);
    const link = tr[i].querySelector('a').href;
    addAction(tr[i],hash,link);
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
}

if ( document.readyState === 'loading' ) {
  document.addEventListener('DOMContentLoaded',init);
} else {
  init();
}