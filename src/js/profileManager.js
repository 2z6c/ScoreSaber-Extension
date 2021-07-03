import { readStorage, writeStorage } from './storage';
/**
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
   * @param {UserProfile} user
   * @returns {Promise<void>}
   */
  async set( user ) {
    if ( await profileManager.is(user.id) ) return;
    profileManager.clearScores();
    return writeStorage(KEY_USER,user);
  },
  /**
   * @returns {Promise<UserProfile|void>}
   */
  async get() {
    return await readStorage(KEY_USER);
  },
  async unset() {
    chrome.storage.local.remove(KEY_USER);
  },
  async clearScores() {
    const user = await readStorage(KEY_USER);
    await writeStorage('lastUpdateUserScores', 0);
    return new Promise( resolve => {
      chrome.runtime.sendMessage({
        updateScores: {
          id: user?.id
        }
      }, resolve );
    });
  },
  /**
   * @returns {Promise<boolean>} locked state after operation.
   */
  async lock() {
    const user = await profileManager.get();
    if ( !user ) return false;
    user.locked = !user.locked;
    writeStorage(KEY_USER,user);
    return user.locked;
  }
};