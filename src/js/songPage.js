import {
  addBookmarkButton,
  extractHash,
  addSongDownloadButton
} from './util';

window.addEventListener('load',()=>{
  const wrapper = document.querySelector('.column.is-one-quarter');
  const hash = extractHash( wrapper.firstChild.src );
  addSongDownloadButton(wrapper,hash);
  addBookmarkButton(wrapper,hash,location.toString());
});