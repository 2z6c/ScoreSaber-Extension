import { getLastUpdate } from './scoresaber';

function setUserID() {
  chrome.storage.local.get('uid',({uid})=>{
    if ( !uid ) return;
    /** @type {HTMLInputElement} */
    const input = document.getElementById('user-id');
    input.value = uid;
  });
  document.getElementById('lock-user-id').addEventListener('click',toggleLock);
}

let locked = false;
/** @param {MouseEvent} e */
function toggleLock(e) {
  locked = !locked;
  const i = e.currentTarget.querySelector('i');
  i.className = 'fas ' + (locked?'fa-lock':'fa-lock-open');
  const input = e.currentTarget.previousSibling;
  input.disabled = locked;
}

async function setLastUpdate() {
  const b = document.getElementById('last-update-date');
  b.textContent = new Date(await getLastUpdate()).toLocaleString();
}

window.addEventListener('load',()=>{
  setUserID();
  setLastUpdate();
})