import { messageAPI } from '../api/message';
import { formatter } from '../util';

function create(html) {
  const div = document.createElement('div');
  div.insertAdjacentHTML('afterbegin',html);
  return div.firstElementChild;
}

/**
 * @typedef Score
 * @property {number} pp
 * @property {number} [accuracy]
 * @property {number} [score]
 * @property {number} leaderboardId
 */

class ScoreCellTop {
  #pp = 0;
  title = 'The predicted PP you will get if you achieve the same score.';
  value = ['N/A','N/A'];
  set pp( pp ) {
    if ( isNaN(pp) ) return;
    this.#pp = parseFloat(pp);
    this.value[0] = formatter.toFraction(pp)+'pp';
  }
  set sub(text) {
    this.value[1] = text;
  }
  async predict( leaderboardId, targetPP ) {
    let gain = 0;
    if ( this.#pp < targetPP ) {
      gain = await messageAPI.predictScore({
        leaderboardId: parseInt(leaderboardId),
        pp: targetPP,
      });
      // gain = Math.round( gain * 100 ) / 100;
    }
    this.value[1] = `+${formatter.toFraction(gain)}pp`;
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
  color = ['gold','gray'];
  style = '';
  invert = false;
  compare( base, target ) {
    if ( !base ) base = 100;
    const v = ( target - base ) * 100 / base;
    console.log( base, target, v );
    if ( v < 0 ) {
      this.color[0] = 'lightgreen';
      this.guage( -v );
    } else if ( v > 0 ) {
      this.color[0] = 'pink';
      this.invert = true;
      this.guage( v );
    }
  }
  /** @param {number} v */
  guage( v ) {
    this.style = `background:linear-gradient(${this.invert?'270deg':'90deg'},${this.color[0]} ${v}%, ${this.color[1]} ${v}%);`;
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
  /** @type {number} */
  #accuracy;
  /** @type {number} */
  #score;
  #gap;
  /** @type {'accuracy'|'score'} */
  mode;
  set accuracy(v) {
    if ( isNaN(v) ) return;
    if ( typeof v === 'number' ) this.#accuracy = v;
    else if ( typeof v === 'string' ) this.#accuracy = parseFloat(v);
    this.mode = 'accuracy';
  }
  get accuracy() { return this.#accuracy; }
  set score(v) {
    if ( isFinite(v) ) {
      this.#score = v;
      this.mode = 'score';
    }
  }
  get score() { return this.#score; }
  /**
   * @param {Score} target
   */
  compare( target ) {
    if ( isFinite(target.accuracy) ) {
      this.#gap = formatter.toSignedPercent((this.#accuracy ?? 0) - target.accuracy);
    } else {
      this.#gap = formatter.toInteger((this.score ?? 0) - (target.score ?? 0));
    }
    return this.#gap > 0;
  }
  create() {
    const fragment = /** @type {DocumentFragment} */ (ScoreCellBottom.$wrapper.content.cloneNode(true));
    const span = fragment.querySelectorAll('span');
    if ( this.mode === 'score' ) {
      span[0].textContent = formatter.toInteger(this.score);
    } else if ( this.mode === 'accuracy' ) {
      span[0].textContent = formatter.toPercent(this.#accuracy);
      if ( this.#accuracy ) span[0].insertAdjacentElement('afterbegin', this.createAccuracyBadge() );
    }
    if ( this.#gap ) {
      span[1].textContent = this.#gap;
      fragment.firstElementChild.classList.add((this.#gap > 0) ? 'greater' : 'lower');
    } else {
      span[0].classList.remove('normal-value');
      span[1].remove();
    }
    return fragment;
  }
  static $wrapper =  /** @type {HTMLTemplateElement} */ (create(`
  <template>
    <div class="scoreBottom">
      <span class="normal-value">N/A</span>
      <span class="hovered-value">N/A</span>
    </div>
  </template>`));
  static $badge = /** @type {HTMLTemplateElement} */ (create(`
  <template>
    <i
      class="accuracy-rank-badge"
    ></i>  
  </template>`));
  createAccuracyBadge() {
    const rating = getAccracyRank( this.#accuracy );
    const tmp = /** @type {DocumentFragment} */ (ScoreCellBottom.$badge.content.cloneNode(true));
    const i = tmp.querySelector('i');
    i.classList.add(`rank-${rating}`);
    i.textContent = rating;
    return i;
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
   * @param {import('../types/database').SongScore} base Your score
   * @param {Score} target Opponent's score
   */
  static async compare( base, target ) {
    const mine = new ScoreCell();
    if ( base?.pp ) mine.top.pp = base.pp;
    if ( base?.score ) mine.bottom.score = base.score;
    if ( base?.accuracy ) mine.bottom.accuracy = base.accuracy;
    if ( target.pp ) {
      await mine.top.predict( target.leaderboardId, target.pp );
      mine.hr.compare( base?.pp, target.pp );
      mine.bottom.compare(target);
    }
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
  /**
   * @param {HTMLTableCellElement} td
   */
  static from( td ) {
    const cell = new ScoreCell();
    // const regex = /[0-9.]+(?=pp)/gi;
    const tr = td.parentElement;
    const rawPP = parseFloat(tr.dataset.pp);
    const weightedPP = parseFloat(tr.dataset.wpp);

    cell.top.pp = rawPP;
    cell.top.sub = `${weightedPP}pp`;
    cell.top.title = 'Actual accumulated PP value';

    const w = weightedPP * 100 / rawPP;
    cell.hr.guage( w );
    cell.hr.title = `Weighted ${formatter.toPercent(w)}`;

    // const scoreBottom = td.querySelector('.scoreBottom');
    const accuracy = parseFloat(tr.dataset.accuracy);
    cell.bottom.accuracy = accuracy;
    cell.bottom.score = parseInt(tr.dataset.score);

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
