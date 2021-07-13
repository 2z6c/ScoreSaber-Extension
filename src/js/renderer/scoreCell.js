import { messageAPI } from '../api/message';

function create(html) {
  const div = document.createElement('div');
  div.insertAdjacentHTML('afterbegin',html);
  return div.firstElementChild;
}

class ScoreCellTop {
  #pp = 0;
  title = 'The predicted PP you will get if you achieve the same score.';
  value = ['N/A','N/A'];
  set pp( pp ) {
    if ( isNaN(pp) ) return;
    this.#pp = parseFloat(pp);
    this.value[0] = (Math.round(pp * 100) / 100).toFixed(2)+'pp';
  }
  set sub(text) {
    this.value[1] = text;
  }
  async predict( leaderboardId, targetPP ) {
    let gain = 0;
    if ( this.#pp < targetPP ) {
      gain = await messageAPI.predictScore({
        leaderboardId,
        pp: targetPP,
      });
      gain = Math.round( gain * 100 ) / 100;
    }
    this.value[1] = `+${gain.toFixed(2)}pp`;
  }
  create() {
    return create(`
    <div class="scoreTop" >
      <span class="normal-value">${this.value[0]}</span>
      <span
        class="hovered-value"
        title="${this.title}"
      >${this.value[1]}</span>
    </div>`);
  }
}

class ScoreCellSeparator {
  title = '';
  classes = ['score-separater'];
  style = '';
  guage( v ) {
    this.style = `background:linear-gradient(90deg,gold,gold ${v}%,gray ${v}%,gray);`;
  }
  create() {
    return create(`<hr
      class="${this.classes.join(' ')}"
      title="${this.title}"
      style="${this.style}"
    >`);
  }
}

class ScoreCellBottom {
  accuracy;
  #score;
  set score(v) {
    this.#score = v.toLocaleString();
  }
  create() {
    const element = create(`<span class="scoreBottom">N/A</span>`);
    if ( this.accuracy ) {
      element.textContent = this.accuracy.toFixed(2) + '%';
      element.insertAdjacentElement( 'afterbegin', createAccuracyBadge(this.accuracy) );
    } else if ( this.#score ) {
      element.textContent = this.#score;
    }
    return element;
  }
}

export class ScoreCell {
  top = new ScoreCellTop();
  hr = new ScoreCellSeparator();
  bottom = new ScoreCellBottom();
  create() {
    const div = document.createElement('div');
    div.appendChild( this.top.create() );
    div.appendChild( this.hr.create() );
    div.appendChild( this.bottom.create() );
    return div;
  }
  /**
   * @param {import('../types/database').SongScore} base
   * @param {number} targetPP
   */
  static async compare( base, leaderboardId, targetPP ) {
    const mine = new ScoreCell();
    if ( base?.pp ) mine.top.pp = base.pp;
    if ( targetPP ) await mine.top.predict( leaderboardId, targetPP );
    if ( base?.score ) mine.bottom.score = base.score;
    if ( base?.accuracy ) mine.bottom.accuracy = base.accuracy;
    return mine.create();
  }
  static mine( base ) {
    const mine = new ScoreCell();
    if ( base?.pp ) mine.top.pp = base.pp;
    mine.top.value[1] = mine.top.value[0];
    mine.top.title = '';
    if ( base?.score ) mine.bottom.score = base.score;
    if ( base?.accuracy ) mine.bottom.accuracy = base.accuracy;
    return mine.create();
  }
  static from( td ) {
    const cell = new ScoreCell();
    const regex = /[0-9.]+(?=pp)/gi;
    const rawPP = parseFloat(regex.exec(td.textContent)[0]);
    const weightedPP = parseFloat(regex.exec(td.textContent)[0]);

    cell.top.pp = rawPP;
    cell.top.sub = `${weightedPP}pp`;
    cell.top.title = 'Actual accumulated PP value';

    const w = weightedPP * 100 / rawPP;
    cell.hr.guage( w );
    cell.hr.title = `Weighted ${w.toFixed(2)}%`;

    const scoreBottom = td.querySelector('.scoreBottom');
    const accuracy = parseFloat(scoreBottom.textContent.match(/\d+\.?\d*(?=%)/)?.[0]);
    cell.bottom.accuracy = accuracy;
    cell.bottom.score = scoreBottom.textContent.replace(/\..*$/,'').replace(/^.*\s/,'');

    return cell.create();
  }
}

export function getAccracyRank( accuracy ) {
  if ( accuracy === 100.0 ) return 'SSS';
  else if ( accuracy >= 90.0 ) return 'SS';
  else if ( accuracy >= 80.0 ) return 'S';
  else if ( accuracy >= 65.0 ) return 'A';
  else if ( accuracy >= 50.0 ) return 'B';
  else if ( accuracy >= 35.0 ) return 'C';
  else if ( accuracy >= 20.0 ) return 'D';
  return 'E';
}

export function createAccuracyBadge( accuracy ) {
  const rating = getAccracyRank( accuracy );
  return create(`<i
    class="accuracy-rank-badge rank-${rating}"
  >${rating}</i>`);
}

