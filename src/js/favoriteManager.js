import { KEY_FAVORITE, pushStorage, readStorage, removeFavorite } from './storage';
/**
 * @typedef {import('./storage').Favorite} Favorite
 */

export const favorite = {
  /**
   * @yields {Favorite}
   */
  async *[Symbol.asyncIterator](){
    const list = await readStorage(KEY_FAVORITE);
    if ( !list ) return;
    for ( const item of list ) yield item;
  },
  /**
   * @param {Favorite} user
   */
  add( user ) {
    return pushStorage(KEY_FAVORITE,user);
  },
  remove( userId ) {
    return removeFavorite(userId);
  },
  async contains( userId ) {
    const list = await readStorage(KEY_FAVORITE);
    if ( !list ) return false;
    return list.some(f=>f.id === userId );
  }
};