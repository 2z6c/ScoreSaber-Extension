import { fetchPlayer, fetchPlayerScore } from './integration/scoresaber';
import { profileManager } from './profileManager';
import { scoreManager } from './scoreManager';
// import { downloadJson } from './util';

export async function snipe( targetId, threshold=20 ) {
  const myProfile = await profileManager.get();
  if ( !myProfile ) return;
  if ( typeof targetId !== 'string' && typeof targetId !== 'number' ) throw new Error(`Invalid target id. ${targetId}`);
  // const myScores = await scoreManager.getUserScore(myProfile.id);
  const target = await fetchPlayer( targetId );
  const songs = [];
  for await ( const score of fetchPlayerScore( targetId, 'top' ) ) {
    const myScore = await scoreManager.getScore( myProfile.id, score.leaderboardId );
    if ( score.pp * score.weight < threshold ) break;
    if ( !myScore || score.pp - myScore.pp > threshold ) {
      songs.push({
        hash: score.songHash,
        songName: score.songName,
        levelAuthorName: score.levelAuthorName,
        difficulties: [{
          characteristic: 'Standard',
          name: score.difficultyRaw.split('_')[1],
        }]
      });
    }
  }
  return {
    playlist: {
      playlistTitle: `Snipe ${target.playerInfo.playerName}`,
      playlistAuthor: (await profileManager.get())?.name || 'ScoreSaber-Extension',
      image: await createPlayerAvatorBase64(target.playerInfo.avatar),
      songs,
    },
    title: `snipe_${target.playerInfo.playerName}`
  };
}

async function createPlayerAvatorBase64(url) {
  const res = await fetch(`https://new.scoresaber.com${url}`);
  if ( !res.ok ) return;
  const blob = await res.blob();
  const reader = new FileReader();
  await new Promise( resolve => {
    reader.addEventListener('load', resolve);
    reader.readAsDataURL(blob);
  });
  return reader.result;
}