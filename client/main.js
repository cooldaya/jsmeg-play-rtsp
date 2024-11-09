function createJsmpegPlayer  (url, el, options = {}) {
  function initCanvas(el) {
    const containerEl = el instanceof Element ? el : document.querySelector(el);
    containerEl.innerHTML = "";
    const canvas = document.createElement("canvas");
    containerEl.appendChild(canvas);
    Object.assign(canvas.style, {
      width: "100%",
      height: "100%"
    });
    return canvas;
  }
  const { host = window.location.hostname, port = 9984, ...args } = options;
  const ws_url = `ws://${host}:${port}/?url=${url}`;
  const canvas = initCanvas(el);
  const player = new JSMpeg.Player(ws_url, { canvas, ...args });
  return player;
}

