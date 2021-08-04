import { promisify } from './db';

/**
 * @typedef {import('../types/database').Level} Level
 */

const VERSION = 3;
const KEY = 'ranked-maps';

const extructDifficulty = _diff_type => _diff_type.split('_')[1].replace('Plus','+');

export class RankedSongManager {
  /** @type {IDBDatabase} */
  #db;
  async #open() {
    const request = indexedDB.open('rankedSongs',VERSION);
    const upgrade = e => {
      console.log(e.target.result);
      this.#createObjectStore(e);
    };
    request.addEventListener('upgradeneeded', upgrade );
    this.#db = await promisify(request);
  }
  #close() {
    this.#db.close();
  }
  async #createObjectStore(e) {
    this.#db = e.target.result;
    const request = e.currentTarget.transaction.objectStore(KEY).getAll();
    const data = await promisify(request);
    this.#db.deleteObjectStore(KEY);
    const store = this.#db.createObjectStore(KEY,{keyPath: ['hash','diff']});
    store.createIndex('hash','hash', {unique:false});
    store.createIndex('leaderboardId','leaderboardId', {unique:true});
    store.createIndex('star','stars',{unique: false});
    for ( const item of data ) {
      store.add(item);
    }
  }
  destruct() {
    const request = indexedDB.deleteDatabase('rankedSongs');
    return promisify(request);
  }
  async clear() {
    await this.#open();
    const request = this.#db.transaction(KEY).objectStore(KEY).clear();
    await promisify(request);
    this.#close();
  }
  /**
   * @param {import('../types/scoresaber').ScoreSaber.Song} raw
   */
  async add( raw ) {
    await this.#open();
    /** @type {Level} */
    const song = {
      hash: raw.id,
      diff: extructDifficulty(raw.diff),
      stars: raw.stars,
      leaderboardId: raw.uid,
    };
    const request = this.#db.transaction(KEY,'readwrite').objectStore(KEY).add(song);
    try {
      await promisify(request);
    } catch ( e ) {
      if ( e instanceof Error ) throw e;
      else if ( e?.target?.error?.name !== 'ConstraintError' ) throw e?.target?.error;
      else return true;
    }
    this.#close();
  }
  async get( hash, diff ) {
    await this.#open();
    const request = this.#db.transaction(KEY,'readonly').objectStore(KEY).get([hash,diff]);
    const song = await promisify(request);
    this.#close();
    return song;
  }
  /**
   * @param {number} min minimum star rank
   * @param {number} max maximum star rank
   * @returns {Promise<Level[]>}
   */
  async getRange( min, max ) {
    await this.#open();
    const range = IDBKeyRange.bound( min, max );
    const request = this.#db.transaction(KEY,'readonly')
      .objectStore(KEY)
      .index('star')
      .getAll(range);
    const list = await promisify(request);
    this.#close();
    return list;
  }
  /**
   * @param {number} min minimum star rank
   * @param {number} max maximum star rank
   * @returns {Promise<[number,number]>}
   */
  async countRange( min, max ) {
    await this.#open();
    const range = IDBKeyRange.bound( min, max );
    const request = this.#db.transaction(KEY,'readonly')
      .objectStore(KEY)
      .index('star')
      .getAll(range);
    const levels = await promisify(request);
    this.#close();
    const n = levels.length;
    const m = new Set(levels.map(v=>v.hash)).size;
    return [n,m];
  }
}