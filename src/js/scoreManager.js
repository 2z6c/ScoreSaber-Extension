/** @typedef {import("./types/storage").SongScore} SongScore */

const VERSION = 1;
const KEY_SCORES = 'scores';

/**
 * @template T
 * @param {IDBRequest<T>} request 
 * @returns {Promise<T>}
 */
const promisify = request => new Promise( (resolve,reject) => {
  request.addEventListener('success',e=>{
    resolve( e.target.result );
  });
  request.addEventListener('error', e=>{
    reject(e);
  });
});

class ScoreManager {
  /** @type {IDBDatabase} */
  #db;
  constructor() {
    const request = indexedDB.open('scoreManager',VERSION);
    promisify(request).then( db => {
      this.#db = db;
    }).catch( e => {
      console.error(e);
    });
    request.addEventListener('upgradeneeded', e=>{
      this.#createObjectStore();
    });
  }
  #createObjectStore(){
    const store = this.#db.createObjectStore(KEY_SCORES);
    store.createIndex('leaderboardId', 'leaderboardId', {unique:false});
    store.createIndex('userId', 'userId', {unique:false});
    store.createIndex('user score', ['userId', 'leaderboardId']);
    store.createIndex('score', ['userId', 'leaderboardId', 'pp']);
  }
  /**
   * @param {SongScore} score
   */
  addScore( score ) {
    const request = this.#db.transaction('scores','readwrite').objectStore('score').put(score);
    return promisify(request);
  }
  getUserScore( userId ) {
    const index = this.#db.transaction(KEY_SCORES,'readonly').objectStore(KEY_SCORES).index('userId');
    const request = index.getAll(userId);
    return promisify(request);
  }

  /**
   * 
   * @param {SongScore} score
   */
  getRankOf( score ) {
    const index = this.#db.transaction(KEY_SCORES,'readonly').objectStore(KEY_SCORES).index('score');
    const range = IDBKeyRange.bound(
      [score.leaderboarId,score.userId,score.pp],
      [score.leaderboarId,score.userId,Infinity]
    );
    const request = index.count(range);
    return promisify(request);
  }
}