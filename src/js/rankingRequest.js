import {
  addAction,
  extractHash,
  waitElement,
} from './util';

const observer = new IntersectionObserver( entries => {
  for ( const entry of entries ) if ( entry.isIntersecting ) {
    const el = entry.target;
    const hash = extractHash( el.querySelector('img').src );
    addAction( el, hash, el.querySelector('a').href );
    observer.unobserve(el);
  }
});

async function waitTable() {
  let head = document.querySelectorAll('.songs thead tr');
  let loop = 100;
  while ( head.length < 1 || loop-- < 0 ) {
    await new Promise(r=>setTimeout(r,1000));
    head = document.querySelectorAll('.songs thead tr');
  }
  return head;
}

async function init() {
  const head = await waitTable();
  for ( let i = 0; i < head.length; i++ ) {
    head[i].insertAdjacentHTML('beforeend','<th>Action</th>');
  }
  const tr = document.querySelectorAll('.songs tbody tr');
  for ( let i = 0; i < tr.length; i++ ) {
    await waitElement('img',tr[i]);
    observer.observe( tr[i] );
  }
}

init();
