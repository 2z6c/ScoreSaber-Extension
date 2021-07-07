import {
  addAction,
  postToBackground,
  makeDifficultyLabel,
  createMyScore,
  createAccuracyBadge,
  downloadJson,
  connectToBackground,
} from './util.js';
import { favorite } from './favoriteManager';
import { profileManager } from './profileManager.js';
import { Toast } from './toast.js';

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
  const locked = (await profileManager.get())?.locked;
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
  title.nextElementSibling.addEventListener('click',setMyProfile);
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

async function setMyProfile(e) {
  const user = await postToBackground({getUser:{id:UID}});
  await profileManager.set(user);
  e.target.closest('h5').classList.add('my-account');
}

async function addFavoriteButton(title) {
  const isFav = await favorite.contains(UID);
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
    const toast = Toast.wait('Generating Playlist...');
    const port = connectToBackground('snipe', {targetId:UID});
    port.onMessage.addListener((msg)=>{
      if ( msg.completed ) {
        toast.progress(msg.completed/(msg.completed+1));
      } else if ( msg.playlist ) {
        downloadJson(msg.playlist,msg.title);
        toast.close();
      }
    });
  });
}

/** @param {MouseEvent} e */
async function handleFavorite(e) {
  const name = getUserName();
  if ( await favorite.contains(UID) ) {
    await favorite.remove( UID );
    e.target.classList.replace('fas','far');
    Toast.push(`${name} has been removed from your favorite.`);
  } else {
    await favorite.add({
      id: UID,
      name,
      avatar: document.querySelector('.avatar > img').src,
      country: document.querySelector('a[href*="country"]').href.match(/(?<=country=)../)[0],
    });
    e.target.classList.replace('far','fas');
    Toast.push(`${name} has been added to your favorite.`);
  }
}

function unsetMyAccount(e) {
  profileManager.unset();
  e.target.closest('h5').classList.remove('my-account');
  Toast.push(`${getUserName()} is not as your profile now.`);
}

async function checkMyProfile() {
  if ( await profileManager.is(UID) ) {
    document.querySelector('.title.is-5').classList.add('my-account');
  }
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

function modifyPP(tr) {
  const td = tr.querySelector('.score');
  const regex = /[0-9.]+(?=pp)/gi;
  const rawPP = regex.exec(td.textContent)[0];
  const weightedPP = regex.exec(td.textContent)[0];
  const w = weightedPP * 100 / rawPP;
  const scoreBottom = td.querySelector('.scoreBottom');
  while ( scoreBottom.previousElementSibling ) scoreBottom.previousElementSibling.remove();

  const accracy = parseFloat(scoreBottom.textContent.match(/\d+\.?\d*(?=%)/)?.[0]);
  let bottomText = 'N/A';
  if ( isNaN(accracy) ) {
    bottomText = scoreBottom.textContent.replace(/\..*$/,'').replace(/^.*\s/,'');
  } else {
    bottomText = `${accracy.toFixed(2)}%`;
  }
  const badge = accracy ? createAccuracyBadge(accracy) : '';
  td.innerHTML = `
  <div style="display:inline-block">
    <div
      class="scoreTop"
      style="border-image-source:linear-gradient(90deg,gold,gold ${w}%,gray ${w}%,gray);"
    >
      <span class="raw-pp">${rawPP}pp</span>
      <span class="weighted-pp">${weightedPP}pp</span>
    </div>
    <span class="scoreBottom">
      ${badge}
      ${bottomText}
    </span>
  </div>`;
}

async function addComparison(tr,userId) {
  const leaderboardId = new URL(tr.querySelector('.song a').href).pathname.split('/').pop() | 0;
  const targetPP = parseFloat(/[\d.]+(?=pp)/.exec(tr.querySelector('.score').textContent));
  const td = document.createElement('td');
  const th = tr.querySelector('.score');
  th.insertAdjacentElement('afterend', td);
  td.classList.add('score');
  const score = await postToBackground({getScore: {leaderboardId, userId}});
  if ( score?.pp > targetPP ) td.classList.add('win');
  else th.classList.add('win');
  td.insertAdjacentHTML('afterbegin', await createMyScore(score,leaderboardId,targetPP));
  /*
  if ( !score ) {
    td.style.backgroundImage = makeGradient(-100);
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
  //*/
}

async function addStars(tr,hash) {
  const dif = tr.querySelector('span[style^="color"]');
  const diffText = dif.textContent.trim();
  const star = await postToBackground({getStar:{hash,diffText}});
  dif.closest('div').insertAdjacentHTML('beforebegin',makeDifficultyLabel(diffText,dif.style.color,star));
  dif.remove();
  tr.classList.add(star?'ranked-map':'unranked-map');
}

async function arrangeScoreTable() {
  const tr = document.querySelectorAll('.ranking.songs tr');
  const user = await profileManager.get();
  if ( user ) tr[0].insertAdjacentHTML('beforeend',`<th>${user.name}</th>`);
  tr[0].insertAdjacentHTML('beforeend','<th>Action</th>');
  for ( let i = 1; i < tr.length; i++ ) {
    const hash = tr[i].querySelector('img').src.match(/[0-9a-fA-F]{40}/)[0];

    addStars(tr[i],hash);
    moveMapper(tr[i]);
    modifyPP(tr[i]);
    // addAccracyRank(tr[i]);
    const link = tr[i].querySelector('a').href;
    addAction(tr[i],hash,link);
    if ( user ) addComparison(tr[i],user.id);
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
  arrangeScoreTable();

  checkMyProfile();
  changeRankingLink('a[href="/global"]');
  changeRankingLink('a[href^="/global?country="]');
  const trs = document.querySelectorAll('.ranking.songs tbody tr');
  for ( const tr of trs ) {
    changeSongRankingLink(tr);
  }
  addButtonSetPlayer();
  addButtonExpandChart();
  modifyTableSorter();
  fixPagenation();
  Toast.initialize();
}

if ( document.readyState === 'loading' ) {
  document.addEventListener('DOMContentLoaded',init);
} else {
  init();
}