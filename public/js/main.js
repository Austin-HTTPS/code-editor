let socket;
if (typeof io != "undefined") {
  socket = io(window.location.origin);
}

function newproject(lang) {
  location = "/newproject/" + lang;
}

// Themes //
const themebtn = document.getElementById("theme");

if (themebtn) {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    localStorage.setItem("theme", "dark");
    themebtn.innerText = "Theme: Light";
  } else {
    localStorage.setItem("theme", "light");
    themebtn.innerText = "Theme: Dark";
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').onchange = (e) => {
      if (e.matches) {
        localStorage.setItem("theme", "dark");
      } else {
        localStorage.setItem("theme", "light");
      }
    }
  }
}

function changeTheme() {
  let theme = localStorage.getItem("theme");
  if (!theme || theme == "light") {
    themebtn.innerText = "Theme: Light";
    light();
  } else if (theme == "dark") {
    themebtn.innerText = "Theme: Dark";
    dark();
  }
  changeTermTheme();
}

function toggleTheme(elm) {
  let theme = localStorage.getItem("theme");
  if (theme == "light") {
    elm.innerText = "Theme: Dark";
    localStorage.setItem("theme", "dark");
    dark();
    if (window.editor) {
      window.editor.setTheme("dark");
    }
  } else {
    elm.innerText = "Theme: Light";
    localStorage.setItem("theme", "light");
    light();
    if (window.editor) {
      window.editor.setTheme("light");
    }
  }
  changeTermTheme();
}

const topbar = document.querySelector("#topbar");
const conso = document.querySelector("#terminal");
const container = document.querySelector("#container");
const sizers = document.querySelectorAll(".sizer");
const runbtn = document.querySelector("#runbtn");
const savebtn = document.querySelector("#savebtn");
const filetree = document.querySelector("#files");
const filetopbar = document.querySelector("#file-topbar");

function dark() {
  let primary = "rgb(10, 19, 41)";
  let secondary = "rgb(11, 20, 46)";
  let darken = "rgb(8, 17, 38)";
  let text = "rgba(236, 230, 230, 0.863)";

  topbar.style.backgroundColor = primary;
  conso.style.backgroundColor = darken;
  container.style.backgroundColor = primary;
  runbtn.style.color = text;
  savebtn.style.color = text;
  filetree.style.color = text;
  filetree.style.backgroundColor = primary;
  filetopbar.style.backgroundColor = darken;

  for (let i in sizers) {
    if (sizers[i] instanceof HTMLElement) {
      sizers[i].style.backgroundColor = secondary;
      sizers[i].style.color = text;
    }
  }

  for (let i = 0; i < topbar.children.length; i++) {
    topbar.children[i].style.color = text;
  }

  for (let i = 0; i < conso.children.length; i++) {
    conso.children[i].style.color = text;
  }

  topbar.style.color = text;
  conso.style.color = text;
  container.style.color = text;
}

function light() {
  let primary = "rgb(218, 218, 227)";
  let secondary = "rgb(218, 220, 235)";
  let lighten = "rgb(236, 237, 245)";
  let text = "rgba(7, 7, 7, 0.842)";

  topbar.style.backgroundColor = primary;
  conso.style.backgroundColor = lighten;
  container.style.backgroundColor = primary;
  filetree.style.backgroundColor = primary;
  filetopbar.style.backgroundColor = lighten;

  for (let i in sizers) {
    if (sizers[i] instanceof HTMLElement) {
      sizers[i].style.backgroundColor = secondary;
      sizers[i].style.color = text;
    }
  }

  for (let i = 0; i < topbar.children.length; i++) {
    topbar.children[i].style.color = text;
  }

  for (let i = 0; i < conso.children.length; i++) {
    conso.children[i].style.color = text;
  }

  filetree.style.color = text;
  topbar.style.color = text;
  conso.style.color = text;
  container.style.color = text;
  runbtn.style.color = text;
  savebtn.style.color = text;
}

// Editor //

async function getTypes(lang) {
  return new Promise(async (resolve, reject) => {
    let text = {};
    for (let i in files[lang]) {
      let file = files[lang][i];
      await fetch(`/types/${lang}/${file}.d.ts`).then(res => res.text()).then(data => {
        text[file] = data;
      }).catch(err => {
        reject(err);
      });
    }
    for (let i in text) {
      monaco.languages.typescript.javascriptDefaults.addExtraLib(text[i], `/types/${lang}/${i}.d.ts`);
    }
    resolve();
  });
}

// monaco.Uri.parse(lib.url)

async function addLib(code, path, name, dir) {
  if (path[0] == "/") path = path.substring(1);
  if (dir) {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(code,`/projects/${path}`);
    try {
      models[dir][name].model.setValue(code);
    } catch {
      console.log("Failed loading file!");
    }
  } else {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(code, `/projects/${path}`);
    try {
      models[name].model.setValue(code);
    } catch {
      console.log("Failed loading file!");
    }
  }
  
}

async function getCode(file) {
  let resp = await fetch('https://Codingio--theboys619.repl.co/projects' + file);
  let code = resp.text();

  return code;
}