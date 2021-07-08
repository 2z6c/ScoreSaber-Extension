/** @typedef {import('../types/database').SongScore} SongScore */
/** @typedef {import('../types/database').UserScore} UserScore */

import { initAccumlatedScores } from '../scoreComparator';
import { promisify } from './db';

const VERSION = 5;
const KEY_SCORES = 'scores';
const KEY_USERS = 'users';

class ScoreManager {
  /** @type {IDBDatabase} */
  #db;
  constructor() {
  }
  async open(){
    const request = indexedDB.open('scoreManager',VERSION);
    request.addEventListener('upgradeneeded', e=>{
      this.#createObjectStore(e);
    });
    try {
      this.#db = await promisify(request);
    } catch (e_1) {
      console.error(e_1);
    }
    return this;
  }
  close() {
    this.#db.close();
  }
  destruct() {
    const request = indexedDB.deleteDatabase('scoreManager');
    return promisify(request);
  }
  #createObjectStore(e) {
    this.#db = e.target.result;
    if ( this.#db.version < VERSION ) this.#db.deleteObjectStore(KEY_SCORES);
    const store = this.#db.createObjectStore(KEY_SCORES, {keyPath: ['leaderboardId', 'userId']});
    store.createIndex('leaderboardId', 'leaderboardId', {unique:false});
    store.createIndex('userId', 'userId', {unique:false});
    store.createIndex('user', ['userId','pp']);

    this.#db.createObjectStore(KEY_USERS, {keyPath: 'userId'});
    console.log('database updated');
  }
  /**
   * @param {import('../types/scoresaber').ScoreSaber.Song} raw
   */
  async addScore( raw ) {
    const accuracy = raw.maxScore
      ? raw.score * 100 / raw.maxScore
      : void 0;
    await this.open();
    console.log(raw);
    const putReq = this.#db.transaction(KEY_SCORES,'readwrite').objectStore(KEY_SCORES).put({
      leaderboardId: raw.leaderboardId,
      userId: `${raw.uid}`,
      score: raw.score,
      pp: raw.pp,
      accuracy,
    });
    await promisify(putReq);
    this.close();
  }
  /**
   * @param {number} userId
   * @returns {Promise<UserScore>}
   */
  async getUser( userId ) {
    await this.open();
    const request = this.#db.transaction(KEY_USERS,'readonly').objectStore(KEY_USERS).index('userId').get(userId);
    const user = await promisify(request);
    this.close();
    return user;
  }
  /**
   * @returns {Promise<unknown>}
   */
  async updateUser( userId ) {
    const user = {
      userId,
      lastUpdated: Date.now(),
      accumlatedScores: initAccumlatedScores( await this.getUserScore( userId ) ),
    };
    await this.open();
    const putReq = this.#db.transaction(KEY_USERS,'readwrite').objectStore(KEY_USERS).put(user);
    await promisify(putReq);
    this.close();
  }
  /**
   * @param {number} userId
   * @returns {Promise<SongScore[]>}
   */
  async getUserScore( userId ) {
    await this.open();
    const index = this.#db.transaction(KEY_SCORES,'readonly').objectStore(KEY_SCORES).index('userId');
    const request = index.getAll(userId);
    const scores = await promisify(request);
    this.close();
    return scores;
  }

  /**
   * @param {number} userId
   * @returns {Promise<SongScore[]>}
   */
  async getScore( userId, leaderboardId ) {
    await this.open();
    const request = this.#db.transaction(KEY_SCORES,'readonly').objectStore(KEY_SCORES).get([leaderboardId, userId]);
    const score = await promisify(request);
    this.close();
    return score;
  }

  /**
   * 0-indexed
   * @param {SongScore} score
   */
  getRankOf( score ) {
    const index = this.#db.transaction(KEY_SCORES,'readonly').objectStore(KEY_SCORES).index('user');
    console.log( score );
    const range = IDBKeyRange.bound(
      [score.userId,score.pp],
      [score.userId,Infinity]
    );

    const request = index.count(range);
    return promisify(request);
  }
}

export const scoreManager = new ScoreManager();