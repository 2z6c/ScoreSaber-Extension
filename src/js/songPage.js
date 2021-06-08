import {oneClickInstall} from './util';

function makeDLButton() {
  const i = document.createElement('i');
  i.classList.add('fas','fa-cloud-download-alt','song-download-link');
  i.addEventListener('click',oneClickInstall);
  i.setAttribute('title','One-Click Install (with Mod Assistant)');
  i.setAttribute('role','button');
  return i;
}

window.addEventListener('load',()=>{
  // const meta = document.querySelector('[property$="image"][content]').content;
  // [hash] = meta.match(/[0-9A-F]{40}/g);
  document.querySelector('h4.is-5').append(makeDLButton());
});