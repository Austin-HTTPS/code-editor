//--dark-darken: rgb(8, 17, 38);
//--dark-text: rgba(236, 230, 230, 0.863);
//--light-lighten: rgb(236, 237, 245);
//--light-text: rgba(7, 7, 7, 0.842);
let bgcolor = "rgb(236, 237, 245)";
let textcolor = "rgba(7, 7, 7, 0.842)";
if (localStorage.getItem("theme") == "dark") {
  bgcolor = "rgb(8, 17, 38)";
  textcolor = "rgba(236, 230, 230, 0.863)";
} else {
  bgcolor = "rgb(236, 237, 245)"
  textcolor = "rgba(7, 7, 7, 0.842)";
}

const term = new Terminal({
  cursorBlink: "block",
  allowTransparency: true,
  theme: { background: bgcolor, foreground: textcolor, cursor: textcolor },
  fontFamily: 'Ubuntu Mono, courier-new, courier, monospace'
});
term.open(document.getElementById("terminal"));

let currentline = "";
let entries = [];

if (socket) {
  const cons = document.getElementById("terminal");

  socket.emit("Link Term", projectid);

  term.prompt = () => {
    let data = { type: "cmd", msg: currentline };
    socket.emit("SendCMD", data);
  }
  term.prompt();

  function format(lines, text) {
    for (let i in lines) {
      if (lines[i].includes("@") && lines[i].includes("$")) {
        lines[i] = lines[i].replace(/(^[^:]+)|(:)|(~)|(\$)/g, (match) => {
          let data = "";

          if (/^[^:]+/.test(match) && match.includes("@")) {
            data = "\033[38;5;40m" + match + "\033[0m";
          } else {
            data = "\033[38;5;255m" + match + "\033[0m";
          }

          if (match == ":") {
            data = "\033[38;5;252m" + match + "\033[38;5;27m";
          } else if (match == "~") {
            data = "\033[38;5;27m" + match + "\033[38;5;27m";
            console.log(data);
          } else if (match == "$") {
            data = "\033[38;5;252m" + match + "\033[0m";
          }

          return data;
        });
      }
    }

    term.write(lines.join('\n'));
    if (entries.length < 1)
      term.clear();
    currentline = "";
  }

  socket.on("SendData", data => {
    let lines = data.split("\n");
    format(lines, data);
  });

  term.on("key", (key, e) => {
    if (e.keyCode == 13) {
      if (currentline) {
        entries.push(currentline);
        term.write("\r\n");
        term.prompt();
      }
    } else if (e.keyCode == 8) {
      if (currentline) {
        currentline = currentline.substr(0, currentline.length-1);
        term.write("\b \b");
      }
    } else if (!currentline && e.ctrlKey && e.keyCode == 67) {
      currentline += key;
      entries.push(currentline);
      term.write("\r\n");
      term.prompt();
    } else {
      currentline += key;
      term.write(key);
    }
  });

  term.on("paste", (data) => {
    currentline += data;
    term.write(data);
  });

  // socket.on("ConsoleOut", data => {
  //   cons.childNodes[1].innerHTML += `<p>${data.trim()}</p>`;
  //   cons.children[0].scrollTop = cons.children[0].scrollHeight;
  // });

  // socket.on("ConsoleErr", data => {
  //   cons.childNodes[1].innerHTML += `<p class="consoleerr">${data.trim()}</p>`;
  //   cons.children[0].scrollTop = cons.children[0].scrollHeight;
  // });

  socket.on("Update Tree", () => {
    if (model)
      save();
    location.reload();
  });

  // socket.on("Download Types", (args) => {
  //   args.splice(0, 2); // Remove npm and i or install
  //   getTypes(args[0]);
  // });
}

function save() {
  if (!socket) return;
  // term.write("\r\n");
  socket.emit("Save", window.editor.getValue(), projectid, language, selectedfile);
}

function runfile() {
  save();
  if (!socket) return;
  entries.push("{ RUNCMD }");
  socket.emit("Run", projectid, language);
}

function changeTermTheme() {
  if (localStorage.getItem("theme") == "dark") {
    bgcolor = "rgb(8, 17, 38)";
    textcolor = "rgba(236, 230, 230, 0.863)";
  } else {
    bgcolor = "rgb(236, 237, 245)"
    textcolor = "rgba(7, 7, 7, 0.842)";
  }
  term.setOption("theme", {
    background: bgcolor,
    foreground: textcolor,
    cursor: textcolor
  });
}

//9.17431193