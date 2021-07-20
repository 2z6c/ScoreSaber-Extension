/**
 * @param {string} text Difficulty label
 * @param {string} color Color code of label (refer to original label)
 * @param {number} [star] Star Rank
 * @returns {string} HTML string
 */

export const makeDifficultyLabel = (text, color, star) => `
<div class="difficulty-label" style="background:${color}">
  <div>${text}</div>
  <div ${star ? '' : 'hidden'}><i class="fas fa-star"></i>${star?.toFixed(2)}</div>
</div>`;
