import { promisify } from './db';

const VERSION = 1;
const KEY = 'ranked-maps';

const extructDifficulty = _diff_type => _diff_type.split('_')[1].replace('Plus','+');

export class RankedSongManageer {
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
  #createObjectStore(e) {
    this.#db = e.target.result;
    if ( this.#db.version < VERSION ) this.#db.deleteObjectStore(KEY);
    const store = this.#db.createObjectStore(KEY,{keyPath: ['hash','diff']});
    store.createIndex('hash','hash', {unique:false});
    store.createIndex('leaderboardId','leaderboardId', {unique:true});
  }
  destruct() {
    const request = indexedDB.deleteDatabase('rankedSongs');
    return promisify(request);
  }
  /**
   * @param {import('../types/scoresaber').ScoreSaber.Song} raw
   */
  async add( raw ) {
    await this.#open();
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
      if ( e?.target?.error?.name !== 'ConstraintError' ) throw e?.target?.error;
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
}