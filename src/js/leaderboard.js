import { readStorage } from './storage';
import {
  addAction,
  createMyScore,
  extractHash,
  makeDifficultyLabel,
  postToBackground,
} from './util';

async function modifyTable() {
  const tr = document.querySelectorAll('.ranking tr');
  tr[0].insertAdjacentHTML('beforeend',`<th>My Score</th>`);
  tr[0].insertAdjacentHTML('beforeend',`<th>Action</th>`);
  const user = await readStorage('user');
  for ( let i = 1; i < tr.length; i++ ) {
    const hash = extractHash( tr[i].querySelector('img').src );
    margeDifficultyLabel(tr[i]);
    margePlayCount(tr[i]);
    moveMapper(tr[i]);
    insertMyScore(tr[i],user.id);
    addAction(tr[i], hash, tr[i].querySelector('a').href);
  }
  document.querySelector('thead th.stars').remove();
  document.querySelector('thead th.percentage').remove();
  document.querySelector('thead th.author').remove();
}

/**
 * @param {HTMLTableRowElement} tr
 */
function margeDifficultyLabel(tr) {
  const dif = tr.querySelector('.difficulty span');
  const star = tr.querySelector('.stars center');
  const color = dif.style.color;
  const html = makeDifficultyLabel(
    dif.textContent,
    color,
    parseFloat(star.textContent)
  );
  dif.parentElement.innerHTML = html;
  star.parentElement.remove();
}

/**
 * @param {HTMLTableRowElement} tr
 */
function margePlayCount(tr) {
  const total = tr.querySelector('.scores');
  const p24h = tr.querySelector('.percentage');
  total.innerHTML = `
  <div title="Plays (24hrs)">
    <i class="far fa-clock"></i>
    <span>${p24h.textContent}</span>
  </div>
  <div title="Plays">
    <i class="fas fa-globe"></i>
    <span>${total.textContent}</span>
  </div>`;
  p24h.remove();
}

/**
 * @param {HTMLTableRowElement} tr
 * @param {number} userId
 */
async function insertMyScore(tr,userId) {
  const td = document.createElement('td');
  tr.append(td);
  const leaderboardId = tr.querySelector('a').href.split('/').pop()|0;
  const score = await postToBackground({getScore:{leaderboardId,userId}});
  const html = await createMyScore(score,leaderboardId);
  td.insertAdjacentHTML('afterbegin', html);
}

function moveMapper(tr) {
  const mapper = tr.querySelector('.author');
  const title = tr.querySelector('a');
  const a = `
  <div>
    <div>
      ${title.outerHTML}
    </div>
    <div>
      <a href="/?search=${encodeURIComponent(mapper.textContent.trim())}">
        <i class="fas fa-user-edit mapper-icon" title="Mapper"></i>
        <span>${mapper.textContent}</span>
      </a>
    </div>
  </div>`;
  title.insertAdjacentHTML('afterend',a);
  mapper.remove();
  title.remove();
}

if ( document.readyState === 'loading' ) {
  document.addEventListener('DOMContentLoaded',modifyTable);
} else {
  modifyTable();
}