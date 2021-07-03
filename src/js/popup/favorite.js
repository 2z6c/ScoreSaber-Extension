import { favorite } from '../favoriteManager';
import { BASE_URL } from '../integration/scoresaber';

export async function initFavorite() {
  // /** @type {import('./storage').Favorite[]} */
  // const favorites = await readStorage(KEY_FAVORITE);
  // if ( !favorites ) return;
  const ul = document.getElementById('favorite-player-list');
  const tmp = document.getElementById('favorite-item-template').content;
  for await ( const user of favorite ) {
    const li = tmp.cloneNode(true).firstElementChild;
    li.querySelector('.favorite-player-avator').src = user.avatar;
    li.querySelector('.favorite-player-country').src = `${BASE_URL}/imports/images/flags/${user.country}.png`;
    const a = li.querySelector('.favorite-player-name');
    a.textContent = user.name;
    li.dataset.link = `${BASE_URL}/u/${user.id}`;
    li.addEventListener('click',openUserPage);
    const button = li.querySelector('.remove-favorite');
    button.addEventListener('click', onClickRemoveFavorite);
    button.dataset.id = user.id;
    ul.appendChild(li);
  }
  if ( ul.childElementCount ) ul.nextSibling.classList.add('hidden');
}

/** @param {MouseEvent} e */
function openUserPage(e) {
  const link = e.currentTarget.dataset.link;
  window.open( link, '_blank' );
}

/** @param {MouseEvent} e */
async function onClickRemoveFavorite(e) {
  e.stopPropagation();
  const button = e.currentTarget;
  await favorite.remove( button.dataset.id );
  button.closest('li').remove();
}