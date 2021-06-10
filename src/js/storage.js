const STORAGE = chrome.storage.local;
export const KEY_FAVORITE = 'favorite';

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

export async function pushStorage( key, value ) {
  let list = await readStorage( key );
  if ( !(list instanceof Array) ) {
    if ( !list ) list = [];
    else throw new Error(`${key} is not array.`);
  }
  list.push(value);
  return writeStorage(key,list);
}

export async function removeFavorite( id ) {
  /** @type {*[]} */
  let list = await readStorage(KEY_FAVORITE);
  if ( !list ) return;
  const index = list.findIndex(v=>v.id===id);
  if ( index >= 0 ) list.splice( index, 1 );
  return writeStorage(KEY_FAVORITE,list);
}
