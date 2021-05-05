const ejs = require('ejs');
const path = require("path");
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();
const server = require("http").createServer(app);
const cmd = require("child_process").execSync;
const io = require('socket.io')(server);

const port = 5004

const runprogram = require('./configs/runprogram');

app.use(cors());
app.use(express.json());
app.use(express.static('public'))
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use("/monaco-editor", express.static(path.join(__dirname, "./node_modules/monaco-editor")));
app.use("/projects", express.static(__dirname + "/projects"));
app.use("/types", express.static(path.join(__dirname, "./node_modules/@types")));
app.set('views', "public/views");
app.set('view engine', "html")
app.engine('html', (path, data, cb) => {
  data.TopNav = 
  `
  <nav>
    <div id="topbar" class="nav-wrapper">
      <a href="#" class="brand-logo">Coding.io</a>
      <ul id="nav-mobile" class="right hide-on-med-and-down">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/languages">Languages</a></li>
        <li><a id="theme" href="javascript:void(0)" onclick="toggleTheme(this)">Theme: Light</a></li>
      </ul>
    </div>
  </nav>
  `;
  ejs.renderFile(path, data, {}, cb);
});

// Fun Stuff //

const LANGUAGESPATH = './configs/languages';
const PROJECTSPATH = `./projects`;
const DATABASEPATH = `./database`;

const db = require(`${DATABASEPATH}/database`)(`${DATABASEPATH}/database.json`, true, 2);
let projects = db.Create('projects');
let webapps = db.Create('hosted');
db.Refresh();

const langs = JSON.parse(fs.readFileSync('./configs/languages.json'));

function createnewProject(lang) {
  let randomcode = (Math.random() * 16).toString(16);
  projects.Set(randomcode, { language: lang });

  fs.mkdir(`${PROJECTSPATH}/${randomcode}`, (err) => {
    if (err) return console.log(err);

    copyFolder(`${LANGUAGESPATH}/${lang}`, `${PROJECTSPATH}/${randomcode}`);

    // fs.writeFileSync(`./projects/${randomcode}/${langs[lang].startfile}`, langs[lang].startcode); 
  });

  return randomcode;
}

//Xcopy /E /I C:\dir1\sourcedir D:\data\destinationdir
//cp -r ${src} ${dest}

function copyFolder(source, dest) {
  source = path.join(__dirname, source);
  dest = path.join(__dirname, dest);
  cmd(`cp -r ${source}/. ${dest}`); //UNIX Systems
}

function readalldir(path, obj, cb) {
  let files = fs.readdirSync(path);

  for (let i in files) {
    let file = files[i];
    if (fs.lstatSync(path + '/' + file).isDirectory()) {
      readalldir(path + '/' + file, [], (data) => {
        let folder = {};
        folder[file] = data;
        obj.push(folder);
      });
    } else {
      obj.push(file);
    }
  }

  if (cb && typeof cb == "function") {
    cb(obj);
  }
}

const Path = require("path");
const deleteFolderRecursive = function(path) {
  if (!path || path == "/" || path == "./") return;
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

// Routing Stuff //

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/newproject/:lang', (req, res) => {
  let lang = req.params.lang;
  let projectid = createnewProject(lang);
  res.redirect('/project/' + projectid);
});

app.get('/project/:projectcode', (req, res) => {
  let projectid = req.params.projectcode;
  if (projects.Get(projectid)) {
    let project = projects.Get(projectid);
    const MainFile = `/${projectid}/${langs[project.language].startfile}`;
    const MainFileName = langs[project.language].startfile;
    const hiddenfiles = langs[project.language].hiddenfiles;
    const files = [];

    readalldir(`${PROJECTSPATH}/${projectid}`, files, (data) => {
      const filtered = data.filter(item => {
        if (item.constructor == ({}).constructor) {
          let key = Object.keys(item)[0];
          return !hiddenfiles.includes(key);
        } else {
          return !hiddenfiles.includes(item);
        }
      });
      data = JSON.stringify(filtered);
      res.render('editor', {Language: project.language, ProjectId: projectid, Files: data, MainFile, MainFileName});
    });
  } else {
    res.redirect('/');
  }
});

app.get("/languages", (req, res) => {
  res.redirect("/");
});

app.get("/about", (req, res) => {
  res.redirect("/");
});

// Login and Create //

// app.get("/create", (req, res) => {
//   res.render("create");
// });

// app.get("/login", (req, res) => {
//   res.render("login");
// });

// app.post("/create", (req, res) => {
//   // console.log(req.body);
// });

// app.post("/login", (req, res) => {
//   // console.log(req.body);
// });

require('./socket')(io, langs);

// Console Commands //

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (question) => {
  return new Promise((resolve, reject) => {
    rl.question(question, answer => {
      resolve(answer);
    })
  });
}

function cmdCommand() {
  question('> ').then(answer => {
    let args = answer.split(/\s+/);

    if (args[0] == "clear") {
      db.Refresh();
      db.Clear(args[1]);
      if (args[1] == "projects") {
        let folders = fs.readdirSync(PROJECTSPATH);
        for (let folder of folders) {
          if (folder) {
            deleteFolderRecursive(PROJECTSPATH + '/' + folder);
          }
        }
      }
    } else {
      console.log(args);
    }

    cmdCommand();
  });
}

/*
rl.question('What do you think of Node.js? ', (answer) => {
  // TODO: Log the answer in a database
  console.log(`Thank you for your valuable feedback: ${answer}`);

  rl.close();
});
*/

server.listen(port, () => {
  console.clear();
  console.log(`App running on port ${port}`);
  cmdCommand();
})