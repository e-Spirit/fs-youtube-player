const appendTo = (targetElement, newTag, attributes) =>
  Object.assign(targetElement.appendChild(document.createElement(newTag)), attributes);

const getYouTubePlayer = (iframe) => {
  const YT_API_URL = 'https://www.youtube.com/iframe_api';
  document.querySelector(`script[src="${YT_API_URL}"]`) || appendTo(document.body, 'script', { src: YT_API_URL });

  return new Promise((resolve) => {
    (function check() {
      window.YT && YT.loaded
        ? new YT.Player(iframe, { events: { onReady: ({ target }) => resolve(target) } })
        : window.setTimeout(check, 10);
    })();
  });
};

const template = document.createElement('template');
template.innerHTML = /* html */ `
  <style>
    :host { --ratio: 1.6; --items-width: 30%; --items-count: 1; --bullets: 2.25em; display: grid; grid-template-columns: auto var(--items-width) calc(var(--bullets) + 1em); }
    #player { height: 0; padding-bottom: calc(100% / var(--ratio)); background: black; position: relative; overflow: hidden; }
    #player iframe { border: 0; padding: 0; margin: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    #items-box { position: relative; flex: 1; }
    #items-container { position: absolute; top: var(--bullets); right: 0; bottom: var(--bullets); left: var(--bullets); overflow-x: hidden; overflow-y: auto; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; scroll-snap-type: y mandatory; -ms-overflow-style: none; scrollbar-width: none; }
    #items-container::-webkit-scrollbar { display: none; }
    #items { height: calc(var(--items-count) * 100%); display: flex; flex-direction: column; }
    #bullets-box { display: flex; flex-direction: column; padding: var(--bullets) 0; margin: 0 0.5em; }
    #bullets-box input { -webkit-appearance: none; -moz-appearance: none; outline: none; cursor: pointer; }
    #bullets-box input[type='button'] { border: 0; margin: 0; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 19V6M5 12l7-7 7 7'/%3E%3C/svg%3E") no-repeat center; width: var(--bullets); height: var(--bullets); background-size: 90%; }
    #bullets { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    #bullets input[type='radio'] { margin: calc(var(--bullets) / 4); width: calc(var(--bullets) / 2); height: calc(var(--bullets) / 2); background: #fff; border: 1px solid #ccc; border-radius: 50%; }
    #bullets input[type='radio']:checked { border: 1px solid #000; position: relative; }
    #bullets input[type='radio']:checked::after { content: ''; background-color: #000; position: absolute; top: 2px; right: 2px; bottom: 2px; left: 2px; border-radius: 50%; }
    #nextItem { transform: rotate(180deg); }
    ::slotted(:not([data-time])) { display: none; }
    ::slotted([data-time]:not([data-time=''])) { flex: 1; display: flex; flex-direction: column; box-sizing: border-box; scroll-snap-align: center; height: 100%; overflow: hidden; justify-content: center; }
    @media (max-width: 750px) {
      :host { grid-template-columns: 1fr calc(var(--bullets)); grid-template-rows: 1fr 1fr; }
      #video-box { grid-column: 1 / 3; }
      input[type='button'] { display: none; }
      #items-container { top: 0; bottom: 0; left: 0; }
      #bullets-box { padding: 0; margin: 0; }
    }
    :host([no-items]) { grid-template-columns: 1fr; }
    :host([no-items]) #items-box, :host([no-items]) #bullets-box { display: none; }
    :host([no-items]) #video-box { margin: 0 calc((var(--items-width) + var(--bullets) + 1em) / 2); }
  </style>
  <div id="video-box">
    <div id="player">
      <iframe></iframe>
    </div>
  </div>
  <div id="items-box">
    <div id="items-container">
      <div id="items">
        <slot></slot>
      </div>
    </div>
  </div>
  <form id="bullets-box">
    <input type="button" id="prevItem" />
    <div id="bullets"></div>
    <input type="button" id="nextItem" />
  </form>
`;

const __item = Symbol();

class FsYoutubePlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.videoId) throw new Error('Missing video-id attribute on fs-youtube-player.');

    const $s = (selectors) => this.shadowRoot.querySelector(selectors);
    const $e = (selectors, eventName, handlerFn) =>
      (typeof selectors === 'string' ? $s(selectors) : selectors).addEventListener(eventName, handlerFn);

    $e('#items-container', 'scroll', () => {
      const visibleIndex = Math.round($s('#items-container').scrollTop / this.items[0].node.offsetHeight);
      this.items[visibleIndex].bullet.checked = true;
    });

    $e('slot', 'slotchange', () => {
      const bullets = $s('#bullets');
      bullets.innerHTML = '';
      this.items = $s('slot')
        .assignedNodes()
        .filter((node) => node instanceof HTMLElement && node.matches('[data-time]'))
        .map((node) => ({ node, time: +node.dataset.time }))
        .sort(({ time: t1 }, { time: t2 }) => t1 - t2)
        .map((item, i, arr) => {
          const bullet = appendTo(bullets, 'input', { type: 'radio', name: 'items', checked: i === 0 });
          const match = i + 1 === arr.length ? (t) => t >= arr[i].time : (t) => t >= arr[i].time && t < arr[i + 1].time;
          const show = () => $s('#items-container').scrollTo({ top: i * item.node.offsetHeight, behavior: 'smooth' });
          $e(item.node, 'click', () => show());
          $e(bullet, 'click', () => this.goTo(item.node));
          Object.assign(item, { bullet, match, show });
          item.node[__item] = item.bullet[__item] = item;
          return item;
        });
      $s('#items-container').style.setProperty('--items-count', this.items.length);
      this.items.length ? this.removeAttribute('no-items') : this.setAttribute('no-items', '');
    });

    $e('#prevItem', 'click', (e) => {
      e.preventDefault();
      const checked = e.target.form.querySelector(':checked');
      if (checked && checked.previousElementSibling) checked.previousElementSibling[__item].bullet.click();
    });
    $e('#nextItem', 'click', (e) => {
      e.preventDefault();
      const checked = e.target.form.querySelector(':checked');
      if (checked && checked.nextElementSibling) checked.nextElementSibling[__item].bullet.click();
    });
    $e('#items', 'mouseenter', () => (this[__item] = false));
    $e('#items', 'touchstart', () => (this[__item] = false));
    $e('#items', 'mouseleave', () => delete this[__item]);

    const url = new URL(`https://www.youtube.com/embed/${this.videoId}?enablejsapi=1&fs=0`);
    this.hasAttribute('nocookie') && (url.hostname = 'www.youtube-nocookie.com');
    url.searchParams.set('origin', location.origin);
    const iframe = this.shadowRoot.querySelector('iframe');
    iframe.src = url.toString();
    getYouTubePlayer(iframe).then((player) => {
      this.player = player;
      this.hasAttribute('muted') && player.mute();
      window.setInterval(() => {
        const time = this.player.getCurrentTime();
        if (time !== this.__time && this[__item] !== false) {
          this.__time = time;
          const item = this.items.find(({ match }) => match(this.__time)) || this.items[0];
          item !== this[__item] && (this[__item] = item) && item.show();
        }
      }, 30);
    });
  }
  get videoId() {
    return this.getAttribute('video-id');
  }
  goTo(node) {
    __item in this && delete this[__item];
    const timeEl = node.closest('[data-time]');
    if (timeEl && this.player) this.player.seekTo(+timeEl.dataset.time, true);
  }
}

customElements.define('fs-youtube-player', FsYoutubePlayer);
