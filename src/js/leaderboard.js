import { addAction, extractHash } from './util';

function modifyTable() {
  const tr = document.querySelectorAll('.ranking tr');
  tr[0].insertAdjacentHTML('beforeend',`<th>Action</th>`);
  for ( let i = 1; i < tr.length; i++ ) {
    const hash = extractHash( tr[i].querySelector('img').src );
    addAction(tr[i], hash, tr[i].querySelector('a').href);
  }
}

window.addEventListener('load',()=>{
  modifyTable();
});