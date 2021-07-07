import { clearStorage, readStorage, writeStorage } from './storage';
import { postToBackground } from './util';
/**
 * @typedef {import('./types/scoresaber').ScoreSaber.Player} Player
 * @typedef {import('./types/storage').User} UserProfile
 */
const KEY_USER = 'user';

export const profileManager = {
  /**
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async is( userId ) {
    const user = await readStorage(KEY_USER);
    if ( !user ) return false;
    return user.id === userId;
  },
  /**
   * @param {Player} user
   * @returns {Promise<void>}
   */
  async set( user ) {
    if (! await profileManager.is(user.playerInfo.playerId) ) profileManager.clearScores();
    /** @type {UserProfile} */
    const data = {
      id: user.playerInfo.playerId,
      avatar: `https://new.scoresaber.com${user.playerInfo.avatar}`,
      country: user.playerInfo.country.toLocaleLowerCase(),
      name: user.playerInfo.playerName,
      locked: true,
      lastUpdated: Date.now(),
      globalRank: user.playerInfo.rank,
      countryRank: user.playerInfo.countryRank,
    };
    return writeStorage(KEY_USER,data);
  },
  async onUpdate() {
    const user = await this.get();
    user.lastUpdated = Date.now();
    return writeStorage(KEY_USER,user);
  },
  /**
   * @returns {Promise<UserProfile|void>}
   */
  async get() {
    return await readStorage(KEY_USER);
  },
  async unset() {
    clearStorage(KEY_USER);
  },
  async clearScores() {
    const user = await readStorage(KEY_USER);
    await writeStorage('lastUpdateUserScores', 0);
    return await postToBackground({updateScores:{id:user?.id}});
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