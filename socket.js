const fs = require('fs');
const Path = require(`path`);
const process = require('child_process');
const runprogram = require("./configs/runprogram");
const os = require("os");
const pty = require("node-pty");
const shell = os.platform() == "win32" ? "powershell.exe" : "bash";

const terminals = {};

const PROJECTPATH = `./projects`;

const deleteFolderRecursive = function(path) {
  if (!path || path == "/") return;
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = Path.join(path, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

function server(io, defaults) {
  io.on("connection", (socket) => {

    socket.on("Link Term", (projectid) => {
      socket.project = projectid;
      socket.join(projectid);
      if (terminals[projectid]) return;
      terminals[projectid] = pty.spawn(shell, [], {
        name: "xterm-256color",
        cols: 80,
        rows: 30,
        cwd: Path.join(__dirname, `./projects/${projectid}`),
        env: { ...process.env, HOME: Path.join(__dirname, `./projects/${projectid}`), COLORTERM: "truecolor" }
      });

      terminals[projectid].on("data", (data) => {
        io.in(socket.project).emit("SendData", data);
      });
    });

    socket.on("SendCMD", data => {
      if (!socket.project) return;
      if (data.type == "cmd") {
        terminals[socket.project].write(data.msg + "\r");
      }
    });

    socket.on("disconnect", () => {
      if (!socket.project) return;
      runprogram.stop(socket.project);
    });

    socket.on("Save", (text, projectid, language, filepath) => {
      socket.project = projectid;
      if (!filepath) {
        fs.writeFile(`${PROJECTPATH}/${projectid}/${defaults[language].runfile}`, text, (err) => {
          if (err) console.log(err);
        })
      } else {
        if (filepath[0] == "/") filepath = filepath.substring(1);
        fs.writeFile(`${PROJECTPATH}/${filepath}`, text, (err) => {
          if (err) console.log(err);
        });
      }
    });

    socket.on("Run", (projectid, language) => {
      terminals[projectid].write(`${defaults[language].runcmd} ${defaults[language].runfile} \r`);
      // runprogram.run(defaults, language, projectid, socket);
    });

    socket.on("AddFolder", data => {
      let lang = data.language;
      let projectid = data.projectid;
      let name = data.name;
      let path = data.path;

      if (path[0] == "/") {
        path = path.substring(1);
      }

      fs.mkdir(`${PROJECTPATH}/${projectid}/${path}/${name}`, (err) => {
        if (err) console.log(err);
      });
    });

    socket.on("AddFile", data => {
      let lang = data.language;
      let projectid = data.projectid;
      let name = data.name;
      let path = data.path;

      if (path[0] == "/") {
        path = path.substring(1);
      }

      fs.writeFile(`${PROJECTPATH}/${projectid}/${path}/${name}`, '', (err) => {
        if (err) console.log(err);
      });
    });

    socket.on("RemoveFile", data => {
      let projectid = data.projectid;
      let path = data.path;

      if (!path) return;
      if (path[0] == "/") path = path.substring(1);

      fs.unlink(`${PROJECTPATH}/${projectid}/${path}`, (err) => {
        if (err) console.log(err);
      });
    });

    socket.on("RemoveFolder", data => {
      let projectid = data.projectid;
      let path = data.path;

      if (!path) return;

      deleteFolderRecursive(`${PROJECTPATH}/${projectid}/${path}`);
    });

    socket.on("Download PKG", data => {
      runprogram.download(data, socket);
    });

    // socket.on("OpenFile", data => {
    //   let projectid = data.projectid;
    //   let name = data.name;
    //   let path = data.path;

    //   if (path) {
    //     fs.readFile(`${PROJECTPATH}${projectid}/${name}`, 'buffer', (err, data) => {
    //       socket.emit("FileData", data);
    //     });
    //   } else {
    //     if (path[0] == "/") {
    //       path = path.substring(1);
    //     }
    //     fs.readFile(`${PROJECTPATH}${projectid}/${path}/${name}`, 'buffer', (err, data) => {
    //       socket.emit("FileData", data);
    //     });
    //   }
      
    // });
  });
}

module.exports = server;