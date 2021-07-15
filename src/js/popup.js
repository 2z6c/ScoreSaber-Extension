import { messageAPI } from './api/message';
import { initBookmark } from './popup/bookmark';
import { initFavorite } from './popup/favorite';
import { FormProfile } from './popup/profile';

/** @param {MouseEvent & {currentTarget:HTMLElement}} e */
function changeTab(e) {
  document.querySelectorAll('.active').forEach(el=>{
    el.classList.remove('active');
  });
  const tab = e.currentTarget;
  tab.classList.add('active');
  document.getElementById(tab.title).classList.add('active');
}

/** @param {MouseEvent & {target:HTMLButtonElement}} e */
async function deleteStorageData(e) {
  e.target.disabled = true;
  await new Promise(resolve=>{
    chrome.storage.local.clear(()=>{
      resolve();
    });
  });
  await messageAPI.deleteDB();
  document.getElementById('deletion-state').textContent = 'Succeed to delete extension data.';
}

window.addEventListener('load',()=>{
  const profile = new FormProfile();
  profile.render();
  // setupUpdateRankedSongsButton();
  document.getElementById('clear-all-data').addEventListener('click',deleteStorageData);
  document.querySelectorAll('.tab').forEach(el=>{
    el.addEventListener('click',changeTab);
  });
  initFavorite();
  initBookmark();
  // @ts-ignore
  import('./popup/rank');
});