import {addOperation} from './util.js';

function getUserName() {
  const title = document.getElementsByTagName('title')[0];
  return title.textContent.replace(/'s profile \| ScoreSaber!$/, '');
}

function getPP() {
  const pp = document.querySelector('li:nth-child(2)');
  return pp.textContent.replace(/[^0-9,.]/g, '').replace(',','%2c');
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

function addButtonSetPlayer() {
  const title = document.querySelector('.title a');
  const button = document.createElement('i');
  button.classList.add('far','fa-id-badge');
  button.setAttribute('role','button');
  button.setAttribute('title','Set to My Own Account.');
  button.addEventListener('click',setAsUser);
  title.insertAdjacentElement('afterend',button);
}

function setAsUser() {
  const uid = location.pathname.match(/\d+/)[0];
  const username = getUserName();
  const avatar = document.querySelector('.avatar > img').src;
  chrome.storage.local.set({uid,username,avatar});
}

function addButtonExpandChart() {
  /** @type {HTMLElement} */
  const chart = document.querySelector('.rankChart');
  const i = document.createElement('i');
  i.classList.add('fas','fa-expand','button-chart-expand');
  i.setAttribute('role','button');
  i.addEventListener('click',expandChart);
  chart.insertAdjacentElement('afterbegin',i);
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
function shortenTimestamp(tr){
  const d = tr.querySelector(`.time`);
  let [v,u] = d.textContent.trim().split(' ');
  if ( u.startsWith('min') ) u = 'min';
  else u = u[0];
  const td = document.createElement('td');
  td.textContent = `${v}${u}`;
  td.title = d.title;
  tr.insertAdjacentElement('beforeend',td);
  d.remove();
}

/**
 * @param {HTMLTableRowElement} tr 
 */
function moveMapper(tr) {
  const mapper = tr.querySelector('.mapper');
  const title = tr.querySelector('a');
  const a = document.createElement('a');
  a.insertAdjacentHTML('afterbegin','<i class="fas fa-user-edit mapper-icon" title="Mapper"></i>')
  a.appendChild(mapper);
  a.setAttribute('href',`/?search=${encodeURIComponent(mapper.textContent.trim())}`);
  title.insertAdjacentElement('afterend',a);
  title.insertAdjacentHTML('afterend','<br>');
}

// eslint-disable-next-line no-unused-vars
function addScoreBar(){
  const percentage = document.querySelectorAll('.ranking tbody .scoreBottom');
  for ( const p of percentage ) {
    const text = p.textContent.match(/\d+\.?\d*%/)[0];
    if ( !text ) continue;
    const td = p.closest('th');
    td.insertAdjacentHTML('afterbegin',`<div class="parcentage-bar" style="width:${text}"></div>`);
  }
}

const makeDifficultyLabel = (text,color) => `
<td>
  <div class="difficulty-label" style="background:${color}">
    <div>${text}</div>
    <div><i class="fas fa-star"></i>99.99</div>
  </div>
</td>`;

function arrangeScoreTable() {
  const tr = document.querySelectorAll('.ranking.songs tr');
  //ヘッダ追加
  // const songhead = tr[0].querySelector('.Song');
  // songhead.insertAdjacentHTML('beforebegin','<th>Difficulty</th>');
  tr[0].insertAdjacentHTML('beforeend','<th>Date</th>');
  tr[0].insertAdjacentHTML('beforeend','<th>Op.</th>');
  //各行の処理
  for ( let i = 1; i < tr.length; i++ ) {
    //難易度移動
    const dif = tr[i].querySelector('span[style^="color"]');
    dif.closest('div').insertAdjacentHTML('beforebegin',makeDifficultyLabel(dif.textContent,dif.style.color));
    dif.remove();
    shortenTimestamp(tr[i]);
    moveMapper(tr[i]);
    //DLリンク追加
    addOperation(tr[i]);
  }
}

window.addEventListener('load',()=>{
  changeRankingLink('a[href="/global"]');
  changeRankingLink('a[href^="/global?country="]');
  const trs = document.querySelectorAll('.ranking.songs tbody tr');
  for ( const tr of trs ) {
    changeSongRankingLink(tr);
  }
  addButtonSetPlayer();
  addButtonExpandChart();
  arrangeScoreTable();
});