const STORAGE = chrome.storage.local;
export const KEY_FAVORITE = 'favorite';
export const KEY_BOOKMARK = 'bookmark';

/**
 * @param {string} key
 * @returns {Promise<unknown>}
 */
export function readStorage(key) {
  return new Promise( resolve => {
    STORAGE.get(key, items => {
      resolve(items[key]);
    });
  });
}

/**
 *
 * @param {string} key
 * @param {*} value
 * @returns {Promise<void>}
 */
export async function writeStorage( key, value ) {
  const [k,...props] = key.split('.');
  let obj = value;
  if ( props.length > 0 ) {
    obj = await readStorage(k);
    let tmp = obj;
    while ( props.length > 1 ) tmp = tmp[props.shift()];
    tmp[props[0]] = value;
  }
  return new Promise( resolve => STORAGE.set({[k]:obj}, resolve ));
}

/**
 * @typedef {import("./types/storage").Favorite} Favorite
 * @typedef {import("./types/storage").Bookmark} Bookmark
 *
 * @param {'favorite'|'bookmark'} key
 * @param {Favorite|Bookmark} value
 * @returns
 */
export async function pushStorage( key, value ) {
  let list = await readStorage( key );
  if ( !(list instanceof Array) ) {
    if ( !list ) list = [];
    else throw new Error(`${key} is not array.`);
  }
  list.push(value);
  return writeStorage(key,list);
}

/**
 *
 * @param {string|number} id player id
 * @returns {Promise<void>}
 */
export async function removeFavorite( id ) {
  /** @type {Favorite[]} */
  let list = await readStorage(KEY_FAVORITE);
  if ( !list ) return;
  const index = list.findIndex(v=>v.id===id);
  if ( index >= 0 ) list.splice( index, 1 );
  return writeStorage(KEY_FAVORITE,list);
}

/**
 *
 * @param {string|number} id player id
 * @returns {Promise<boolean>}
 */
 export async function removeBookmark( hash ) {
  /** @type {Bookmark[]} */
  let list = await readStorage(KEY_BOOKMARK);
  if ( !list ) return;
  const index = list.findIndex(v=>v.hash===hash);
  if ( index >= 0 ) list.splice( index, 1 );
  else return false;
  await writeStorage(KEY_BOOKMARK,list);
  return true;
}