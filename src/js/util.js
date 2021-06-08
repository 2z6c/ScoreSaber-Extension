export const makeDLLink = (hash) => `
<i
  class="fas fa-cloud-download-alt oneclick-install"
  role="button"
  title="OneClick Install"
  data-hash="${hash}"
></i>`;

export const makeBookmarkButton = (hash) => `
<i
  class="fas fa-bookmark"
  role="button"
  title="Bookmark"
  data-hash="${hash}"
></i>`;

export function addOperation(tr){
  const td = document.createElement('td');
  const hash = tr.querySelector('img').src.match(/[0-9A-F]{40}/)[0];
  tr.appendChild(td);
  td.insertAdjacentHTML('beforeend',makeDLLink(hash));
  td.querySelector('.oneclick-install').addEventListener('click',oneClickInstall);
  td.insertAdjacentHTML('beforeend',makeBookmarkButton(hash));
}

export async function getMapKey(hash,retries=2) {
  try {
    const res = await fetch(`https://beatsaver.com/api/maps/by-hash/${hash}`);
    if ( res.status === 404 ) return;
    const map = await res.json();
    return map.key;
  } catch(e) {
    console.error(e);
    if ( retries && retries > 0 ) {
      await new Promise(r=>setTimeout(r,3000));
      return await getMapKey(hash,retries-1);
    }
    return;
  }
}

/**
 * @param {MouseEvent} e
 */
export async function oneClickInstall(e){
  /** @type {HTMLElement} */
  const button = e.currentTarget;
  const hash = button.dataset.hash;
  if ( !hash ) return;
  // button.disabled = true;
  const key = await getMapKey(hash)
  if ( !key ) {
    console.error('cannot get map key.');
    return;
  }
  window.open(`beatsaver://${key}`);
  // button.disabled = false;
}