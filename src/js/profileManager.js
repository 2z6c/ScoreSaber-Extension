import { messageAPI } from './api/message';
import {
  clearStorage,
  readStorage,
  writeStorage,
  // KEY_USER_ID
} from './api/storage';
// import { postToBackground } from './util';
/**
 * @typedef {import('./types/scoresaber').ScoreSaber.Player} Player
 * @typedef {import('./types/storage').User} UserProfile
 * @typedef {import('./types/database').UserScore} UserScore
 */
const KEY_USER = 'user';

export const profileManager = {
  async is( userId) {
    const current = await readStorage(KEY_USER);
    return parseInt(current.id) !== userId;
  },
  /**
   * @param {Player} user
   * @returns {Promise<void>}
   */
  async set( user ) {
    /** @type {import('./types/storage').User} */
    const current = await readStorage(KEY_USER);
    const u = await this.getUser( user.playerInfo.playerId );
    if ( current.id !== u.userId ) {
      console.log(`User profile has been changed. ${current.id} => ${u.userId}`);
      profileManager.clearScores();
    }
    /** @type {UserProfile} */
    const data = {
      id: user.playerInfo.playerId,
      avatar: `https://new.scoresaber.com${user.playerInfo.avatar}`,
      country: user.playerInfo.country.toLocaleLowerCase(),
      name: user.playerInfo.playerName,
      locked: true,
      // lastUpdated: Date.now(),
      globalRank: user.playerInfo.rank,
      countryRank: user.playerInfo.countryRank,
    };

    return writeStorage(KEY_USER,data);
  },
  /**
   * @returns {Promise<UserProfile & UserScore>}
   */
  async get() {
    /** @type {UserProfile} */
    const user = await readStorage(KEY_USER);
    const score = await messageAPI.getUser( user.id );
    return Object.assign({}, user, score);
  },
  async getUser( userId ) {
    return await messageAPI.getUser( userId );
  },
  async unset() {
    clearStorage(KEY_USER);
  },
  async clearScores() {
    const user = await readStorage(KEY_USER);
    // await writeStorage('lastUpdateUserScores', 0);
    return await messageAPI.updateScores(user?.id);
  },
  /**
   * @returns {Promise<boolean>} locked state after operation.
   */
  async lock(state) {
    const user = await profileManager.get();
    if ( !user ) return false;
    user.locked = state ?? !user.locked;
    writeStorage(KEY_USER,user);
    return user.locked;
  }
};