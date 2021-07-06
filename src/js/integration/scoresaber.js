/**
 * @typedef {import('../types/scoresaber').ScoreSaber.Schema} Schema
 * @typedef {import('../types/scoresaber').ScoreSaber.Player} Player
 */
import { scoreManager } from '../db/scoreManager';
import { readStorage } from '../storage';
import { RankedSongManageer } from '../db/rankedSongManager';
const rankedSongManager = new RankedSongManageer();

export const BASE_URL = 'https://scoresaber.com';
const NEW_API = 'https://new.scoresaber.com/api';

export function getLastUpdate() {
  return readStorage('lastUpdate');
}

export class ScoreSaberIntegration {
  async updatePlayerScore(id,order,force) {
    const url = `${NEW_API}/player/${id}/scores/${order}/`;
    const request = new ScoreSaberRequest(url);
    for await ( const {scores} of request.each() ) {
      if ( !scores ) break;
      request.max += scores.length;
      for ( const score of scores ) {
        if ( new Date(score.timeSet) < this.lastUpdated ) break;
        await scoreManager.addScore(score);
        request.current++;
      }
      if ( !force && scores.length < 8 ) break;
    }
    request.stop();
  }
  static async getUser(id) {
    const url = `${NEW_API}/player/${id}/full`;
    const request = new ScoreSaberRequest(url);
    return request.send();
  }
}

export class ScoreSaberRequest {
  #stop = false;
  constructor(url) {
    this.url = url;
    this.max = 1;
    this.current = 0;
  }
  get progress() {
    return this.current / this.max;
  }
  static delay(ms=1000) {
    return new Promise(r=>setTimeout(r,ms));
  }
  async #send() {
    const res = await fetch(this.url);
    if ( !res.ok ) throw new Error(`unreachable to ${this.url}`);
    const data = await res.json();
    const result = await this.callback( data );
    await ScoreSaberRequest.delay();
    return result;
  }
  async send() {
    return ScoreSaberRequest.queue = ScoreSaberRequest.queue.then(_=>this.#send());
  }
  async *#each() {
    try {
      for ( let page = 1;; page++ ) {
        if ( this.#stop ) break;
        const url = this.url + page;
        console.log('fetch ', url);
        const res = await fetch(url);
        if ( !res.ok ) break;
        const data = await res.json();
        if ( data ) yield data;
        else break;
        await ScoreSaberRequest.delay(300);
      }
    } catch(e) {
      console.error(e);
    }
  }
  async each() {
    return ScoreSaberRequest.queue = ScoreSaberRequest.queue.then(_=>{
      return this.#each();
    });
  }
  stop() { this.#stop = true; }
  static queue = Promise.resolve();
}

export class SSUserScoreRequest extends ScoreSaberRequest {
  force = false;
  lastUpdated = 0;
  constructor(id,order='recent'){
    super(`${NEW_API}/player/${id}/scores/${order}/`);
    this.userId = id;
    this.order = order;
    scoreManager.getUser(id).then( user => {
      if ( !user ) return;
      this.lastUpdated = user.lastUpdated;
    });
  }
  async *eachScore() {
    for await ( const {scores} of await this.each() ) {
      if ( !scores ) break;
      yield* scores;
      if ( !this.force && scores.length < 8 ) break;
    }
  }
  async send() {
    for await ( const score of this.eachScore() ) {
      if ( new Date(score.timeSet) < this.lastUpdated ) break;
      await scoreManager.addScore(score);
    }
    await scoreManager.updateUser( this.userId );
    console.log(`user scores have been updated.`);
  }
}

export class SSRankedSongsRequest extends ScoreSaberRequest {
  #limit = 50;
  #incremental = true;
  constructor(incremental) {
    const limit = incremental ? 50 : 1000;
    const url = `${BASE_URL}/api.php?function=get-leaderboards&cat=1&limit=${limit}&ranked=1&page=`;
    super(url);
    this.#incremental = incremental;
    this.#limit = limit;
  }
  async *eachSong() {
    for await ( const {songs} of await this.each() ) {
      yield* songs;
      if (songs.length < this.#limit) break;
    }
  }
  async send() {
    for await ( const song of this.eachSong() ) {
      try {
        await rankedSongManager.add( song );
      } catch (e) {
        console.error(e);
        break;
      }
    }
  }
}