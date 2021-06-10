/** @param {MouseEvent} e */
export function openLink(e) {
  e.preventDefault();
  window.open(e.currentTarget.href);
}