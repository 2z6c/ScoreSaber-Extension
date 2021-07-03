const template = (type,message) => `
<li class="toast toast-${type}">
  <div class="toast-progress-bar"></div>
  <div class="toast-body">
    <i class="fas fa-exclamation-circle"></i>
    <span>${message}</span>
  </div>
</li>`;
const LIFETIME = 5000;
const FADETIME = 1000;

export class Toast {
  /** @type {HTMLLIElement} */
  #element;
  /** @type {HTMLElement} */
  #bar;
  constructor( type, message, lifetime = LIFETIME ) {
    if ( !Toast.#initialized ) Toast.initialize();
    this.type = type;
    this.message = message;
    Toast.list.insertAdjacentHTML('afterbegin', template(type,message));
    this.#element = Toast.list.firstElementChild;
    if ( lifetime > 0 ) setTimeout(()=>this.fade(),lifetime);
    this.#element.addEventListener('click',()=>this.close());
    this.#bar = this.#element.querySelector('.toast-progress-bar');
  }
  fade() {
    this.#element.classList.add('toast-burnt');
    setTimeout(()=>this.close(), FADETIME);
  }
  close() {
    this.#element.remove();
  }
  progress(value) {
    this.#bar.style.width = `${value * 100}%`;
  }
  /** @type {HTMLUListElement} */
  static list;
  static #initialized = false;
  static initialize() {
    if ( Toast.#initialized ) return;
    Toast.#initialized = true;
    Toast.list = document.createElement('ul');
    Toast.list.id = 'toast-list';
    document.body.insertAdjacentElement('beforeend',Toast.list);
  }
  static push(message) {
    return new Toast('normal', message);
  }
  static error(message) {
    return new Toast('error', message);
  }
  static wait(message) {
    return new Toast('progress', message, 0);
  }
}