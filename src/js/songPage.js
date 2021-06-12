import {
  addBookmarkButton,
  extractHash,
  addSongDownloadButton
} from './util';

window.addEventListener('load',()=>{
  const wrapper = document.querySelector('.column.is-one-quarter');
  const hash = extractHash( wrapper.firstElementChild.src );
  wrapper.insertAdjacentHTML('beforeend',`
  <div id="song-action-panel"></div>
  `);
  const panel = document.getElementById('song-action-panel');
  addSongDownloadButton(panel,hash);
  addBookmarkButton(panel,hash,location.toString());
});