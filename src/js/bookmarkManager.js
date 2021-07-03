import {
  KEY_BOOKMARK,
  pushStorage,
  readStorage,
  removeBookmark,
} from './storage';

/**
 * @typedef {import('./types/storage').Bookmark} Bookmark
 */

export const bookmark = {
  /**
   * @yields {Bookmark}
   */
  async *[Symbol.asyncIterator](){
    const list = await readStorage(KEY_BOOKMARK);
    if ( !list ) return;
    for ( const item of list ) yield item;
  },
  /**
   * @param {Bookmark} song
   */
  add( song ) {
    return pushStorage(KEY_BOOKMARK,song);
  },
  remove( hash ) {
    return removeBookmark(hash);
  },
  /**
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async contains( hash ) {
    const list = await readStorage(KEY_BOOKMARK);
    if ( !list ) return false;
    return list.some(b=>b.hash === hash );
  }
};