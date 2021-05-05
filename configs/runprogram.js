const fs = require("fs");
const Path = require("path");
const process = require('child_process');
const event = require("events");

const PROJECTPATH = `projects`;

let console = {};
// console.kill();
const runprogram = new event.EventEmitter();

runprogram.run = (defaults, language, projectid, socket) => {
  let cwd = `${PROJECTPATH}/${projectid}`;
  if (console[projectid]) console[projectid].kill();
  switch(defaults[language].runcmd) {
    case "node":
      console[projectid] = process.spawn("node", [`${defaults[language].runfile}`], {cwd});
      break;
    case "python":
      console[projectid] = process.spawn("python", [`${defaults[language].runfile}`], {cwd});
      break;
  }
  console[projectid].stdout.on("data", (data) => {
    consoleOut(data, socket);
  });

  console[projectid].stderr.on("data", (data) => {
    consoleErr(data, socket);
  });
}

runprogram.download = (data, socket) => {
  let args = data.cmd.split(/\s+/);
  let cmdargs = data.cmd.split(/\s+/);
  cmdargs.splice(0, 1);
  if (!args[0] == "npm" && !args[0] == "pip") return;
  let console = process.spawn(args[0], cmdargs, {cwd: `${PROJECTPATH}/${data.projectid}`});

  console.stdout.on("data", (msg) => {
    consoleOut(msg, socket);
    socket.emit("Update Tree");
    if (cmdargs[0] == "i" || cmdargs[0] == "install")
      socket.emit("Download Types", cmdargs);
  });
  
  console.stderr.on("data", (err) => {
    consoleErr(err, socket);
  });
}

function stopprogram(projectid) {
  if (!console[projectid]) return;
  console[projectid].kill();
}

function consoleOut(data, socket) {
  let split = data.toString().split('\n');
  for (let i in split) {
    socket.emit('ConsoleOut', split[i]);
  }
}

function consoleErr(data, socket) {
  let split = data.toString().split('\n');
  for (let i in split) {
    socket.emit('ConsoleErr', split[i]);
  }
}

runprogram.stop = stopprogram;

module.exports = runprogram;