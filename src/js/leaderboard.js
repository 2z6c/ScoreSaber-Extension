import { addOperation } from './util';

function modifyTable() {
  const tr = document.querySelectorAll('.ranking tr');
  tr[0].insertAdjacentHTML('beforeend',`<th>Op.</th>`);
  for ( let i = 1; i < tr.length; i++ ) {
    const hash = tr[i].querySelector('img').src.match(/[0-9a-fA-F]{40}/)[0];
    addOperation(tr[i], hash);
  }
}

window.addEventListener('load',()=>{
  modifyTable();
});