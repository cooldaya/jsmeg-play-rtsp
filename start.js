const { spawn, exec } = require("child_process");
const path = require("path");

spawn("node", ["index.js"], {
  cwd: path.join(__dirname, "./server"),
  stdio: "inherit",
});

const child = exec("http-server -p 8964", {
  cwd: path.join(__dirname, "./client"),
});
child.stdout.on("data", (data) => {
  console.log(data.toString());
});
child.stderr.on("data", (data) => {
  console.error(data.toString());
});

exec("start http://localhost:8964");
