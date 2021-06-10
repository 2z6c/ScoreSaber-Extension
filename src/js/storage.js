const STORAGE = chrome.storage.local;

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
  const list = await readStorage( key );
  if ( !(list instanceof Array) ) throw new Error(`${key} is not array.`);
  list.push(value);
  return writeStorage(key,list);
}