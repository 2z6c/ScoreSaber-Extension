import { addOperation, shortenTimestamp } from './util';

async function waitTable() {
  let head = document.querySelectorAll('.songs thead tr');
  let loop = 100;
  while ( head.length < 1 || loop-- < 0 ) {
    await new Promise(r=>setTimeout(r,1000));
    head = document.querySelectorAll('.songs thead tr');
  }
  return head;
}

function modifyTimestamp(tr) {
  const td = tr.querySelector('.created_at');
  td.textContent = shortenTimestamp(td.textContent);
}

async function init() {
  const head = await waitTable();
  for ( let i = 0; i < head.length; i++ ) {
    head[i].insertAdjacentHTML('beforeend','<th>Op.</th>');
  }
  const tr = document.querySelectorAll('.songs tbody tr');
  for ( let i = 0; i < tr.length; i++ ) {
    console.log(tr[i].innerHTML)
    const hash = tr[i].querySelector('img').src.match(/[0-9a-fA-F]{40}/)[0];
    addOperation( tr[i], hash );
    modifyTimestamp(tr[i]);
  }
}

init();
