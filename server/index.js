const WebSocket = require("ws");
const EventEmitter = require("events");
const Mpeg = require("./src/mpeg.js");

class RtspToWsServer extends EventEmitter {
  constructor(config = {}) {
    super();
    const { host = "0.0.0.0", port = 9984 } = config;
    this.urlStreamCache = new UrlStreamCache();
    this.startWsServer(host, port);
  }

  startWsServer(host, port) {
    const wss = (this.wss = new WebSocket.Server({ host, port }));
    console.log(`RTSP to WS server started on ${host}:${port}`);
    wss.on("connection", (ws, req) => {
      const requestParams = this.parseRequestParams(req.url);
      const { url } = requestParams;

      let dataItemCache = this.urlStreamCache.get(url);
      if (!dataItemCache) {
        console.log(`New stream: ${url}`);
        dataItemCache = new DataItemCache();
        const newMpeg = new Mpeg({ url });
        dataItemCache.setMpeg(newMpeg);
        this.urlStreamCache.set(url, dataItemCache);
      }
      dataItemCache.clients.push(ws);

      ws.on("close", () => {
        let dataItemCache = this.urlStreamCache.get(url);

        if (dataItemCache) {
          const clients = dataItemCache.clients.filter(
            (client) => client.readyState == WebSocket.OPEN
          );
          if (clients.length === 0) {
            this.urlStreamCache.delete(url);
            dataItemCache.stopStream();
          }
          dataItemCache.clients.length = 0;
          dataItemCache.clients.push(...clients);
        }
      });
    });
  }

  parseRequestParams(url) {
    const regex = /([^\?&=]+=[^&?=]*)/g;
    const params = {};
    const matches = url.match(regex);
    if (matches) {
      matches.forEach((match) => {
        const [key, value] = match.split("=");
        params[key] = value;
      });
    }
    return params;
  }
}

class DataItemCache {
  constructor() {
    this.clients = [];
    this.mpeg = null;
  }
  setMpeg(mpeg) {
    if (this.mpeg) return;
    this.mpeg = mpeg;
    mpeg.on("mpeg-data", (data) => {
      this.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return;
        client.send(data);
      });
    });
  }
  stopStream() {
    if (!this.mpeg) return;
    this.mpeg.stop();
    this.mpeg = null;
  }
}

class UrlStreamCache extends Map {
  constructor(...args) {
    super(...args);
  }
}

new RtspToWsServer();
