const { spawn } = require("child_process");
const EventEmitter = require("events");

class Mpeg extends EventEmitter {
  constructor(options = {}) {
    super();
    const { url, full = false } = options;
    const scale = full
      ? "scale=1280:720,setsar=1:1"
      : "scale=480:270,setsar=1:1";

    this.url = url;

    const transferProcess = (this.transferProcess = spawn(
      "ffmpeg",
      [
        // '-thread_queue_size','10240',
        // "-loglevel", "debug",
        "-rtsp_transport",
        "tcp",
        "-i",
        url,
        "-f",
        "mpegts",
        "-codec:v",
        "mpeg1video",
        "-b:v",
        "1000k",
        "-bf",
        "0",
        "-vf",
        scale,
        "-codec:a",
        "mp2",
        "-r",
        "30",
        "-",
      ],
      {
        detached: false,
      }
    ));

    this.inputStreamStarted = true;
    transferProcess.stdout.on("data", (data) => {
      return this.emit("mpeg-data", data);
    });
    transferProcess.stderr.on("data", (data) => {
      // console.log(`stderr: ${data}`);
      // global.process.stderr.write(data);
      return this.emit("mpeg-error", data);
    });
    transferProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
  stop(){
    this.transferProcess.stdout.removeAllListeners();
    this.transferProcess.stderr.removeAllListeners();
    this.transferProcess.kill();
    this.transferProcess = undefined;
    console.log("Mpeg stopped",this.url);
  }
}

module.exports = Mpeg;
