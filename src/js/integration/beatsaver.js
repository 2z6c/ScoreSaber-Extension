export const BEATSAVER_API = 'https://beatsaver.com/api';

/**
 *
 * @param {string} hash
 * @param {number} [retries]
 * @returns {Promise<import("../types/beatsaver").BeatSaver.Map>}
 */
export async function getMapByHash( hash, retries=2 ) {
  try {
    const res = await fetch(`${BEATSAVER_API}/maps/hash/${hash}`);
    const map = await res.json();
    return map;
} catch(e) {
    console.error(e);
    if ( retries === 0 ) throw new Error('Cannot access to beatsaver.com');
    await new Promise(r=>setTimeout(r, 3000));
    return getMapByHash( hash, retries-1 );
  }
}