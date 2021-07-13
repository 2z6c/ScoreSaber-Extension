/**
 * @param {string} channel
 * @param {*} query
 */
function postToBackground( channel, query) {
  return new Promise( resolve => {
    chrome.runtime.sendMessage({
      name: channel,
      query
    }, resolve );
  });
}

/** @type {import('../types/message').Meggaging.Channel} */
export const messageAPI = {
  getRanked( incremental ) { return postToBackground( 'getRanked', incremental ); },
  getScore( query ) { return postToBackground('getScore',query); },
  getUser( query ) { return postToBackground('getUser',query); },
  predictScore( query ) { return postToBackground('predictScore',query); },
  getStar( query ) { return postToBackground('getStar',query); },
  deleteDB() { return postToBackground('deleteDB', true); },
  fetchUser( query ) { return postToBackground('fetchUser',query); },
  updateScores( userId ) { return postToBackground( 'updateScores', userId ); },
};