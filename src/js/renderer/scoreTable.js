import { addAction, extractHash } from '../util.js';
import { makeDifficultyLabel } from './difficultyLabel';
import { profileManager } from '../profileManager.js';
import { messageAPI } from '../api/message.js';
import { ScoreCell } from './scoreCell.js';

/**
 * @param {HTMLTableRowElement} tr
 */
function extractRowData( tr ) {
  tr.dataset.hash = extractHash( tr.querySelector('img').src);
  tr.dataset.leaderboardId = new URL(tr.querySelector('.song a').getAttribute('href')).pathname.split('/').pop();
  const cell = tr.querySelector('.score');
  const ppRE = /[\d.]+(?=pp)/g;
  tr.dataset.pp = ppRE.exec(cell.textContent)?.[0];
  tr.dataset.wpp = ppRE.exec(cell.textContent)?.[0];
  tr.dataset.accuracy = /[\d.]+(?=%)/.exec(cell.textContent)?.[0];
  const score = /(?<=score:\s+)[\d,]+/.exec(cell.textContent)?.[0];
  if ( score ) tr.dataset.score = score.replace(/[^\d]/g,'');
}

async function addStars(tr,hash) {
  const dif = tr.querySelector('span[style^="color"]');
  const diffText = dif.textContent.trim();
  const star = await messageAPI.getStar({hash,diffText});
  dif.closest('div').insertAdjacentHTML('beforebegin',makeDifficultyLabel(diffText,dif.style.color,star));
  dif.remove();
  tr.classList.add(star?'ranked-map':'unranked-map');
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
  const cell = ScoreCell.from(td);
  td.innerText = '';
  td.appendChild( cell );
}

/**
 * @param {HTMLTableRowElement} tr
 * @param {string} userId
 */
async function addComparison(tr,userId) {
  const td = document.createElement('td');
  const th = tr.querySelector('.score');
  const target = /** @type {*} */ (tr.dataset);
  th.insertAdjacentElement('afterend', td);
  td.classList.add('score');
  const score = await messageAPI.getScore({
    leaderboardId: parseInt(target.leaderboardId),
    userId
  });
  td.insertAdjacentElement('afterbegin', await ScoreCell.compare( score, target ) );
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

export async function arrangeScoreTable() {
  /** @type {NodeListOf<HTMLTableRowElement>} */
  const tr = document.querySelectorAll('.ranking.songs tr');
  const user = await profileManager.get();
  if (user)
    tr[0].insertAdjacentHTML('beforeend', `<th>${user.name}</th>`);
  tr[0].insertAdjacentHTML('beforeend', '<th>Action</th>');
  for (let i = 1; i < tr.length; i++) {
    extractRowData(tr[i]);
    const hash = tr[i].querySelector('img').src.match(/[0-9a-fA-F]{40}/)[0];

    addStars(tr[i], hash);
    moveMapper(tr[i]);
    modifyPP(tr[i]);
    const link = tr[i].querySelector('a').href;
    addAction(tr[i], hash, link);
    if (user)
      addComparison(tr[i], user.id);
  }
}
