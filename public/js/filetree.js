const folders = document.getElementsByClassName("folder");
const addfolder = document.getElementsByClassName("add-folder-icon-svg")[0];
const addfile = document.getElementsByClassName("add-file-icon-svg")[0];
const removefile = document.getElementsByClassName("remove-file-icon-svg")[0];
const removefolder = document.getElementsByClassName("remove-folder-icon-svg")[0];
const treeroot = document.getElementsByClassName("root")[0];

const states = {};

function loadscripts() {

  // Register Folders //

  function registerFileTree() {
    for (let i = 0; i < folders.length; i++) {
      folders[i].removeEventListener("click", openFolder);
      folders[i].addEventListener("click", openFolder);
    }
  }

  // Open Items //

  function openFolder() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("opened");
  }

  async function openFile(name, path, modell) {
    let completepath = "";
    if (selectedfile) {
      states[selectedfile] = window.editor.saveViewState();
    }

    if (model)
      addLib(window.editor.getValue(), selectedfile, model.name, model.cd);
    // socket.emit('OpenFile', {projectid, name, path});
    if (path) {
      if (model)
        save();
      if (path[0] == "/") path = path.substring(1);
      if (path[path.length-1] == "/") path.slice(path.length-1, 1);
      if (name[name.length-1] == "/") name.slice(name.length-1, 1);
      completepath = `/${projectid}/${path}/${name}`;
      model = modell;
      // states[`${path}/${name}`] = window.editor.saveViewState();
      window.editor.setModel(model.model);
    } else {
      if (model)
        save();
      if (name[0] == "/") name.substring(1);
      if (name[name.length-1] == "/") name.slice(name.length-1, 1);
      completepath = `/${projectid}/${name}`;
      model = models[name];
      // states[name] = window.editor.saveViewState();
      window.editor.setModel(model.model);
    }

    selectedfile = completepath;
    let code = await getCode(completepath);

    if (path)
      addLib(code, completepath, name, path);
    else
      addLib(code, completepath, name);

    if (states.hasOwnProperty(selectedfile)) {
      window.editor.restoreViewState(states[selectedfile]);      
    } else {
      window.editor.setValue(code);
      states[selectedfile] = window.editor.saveViewState();
    }
  }

  // Add Items //

  addfolder.onclick = (e) => {
    let name = prompt("Folder Name?");
    let path = prompt("Path?");
    if (!name)
      return;
    socket.emit("AddFolder", {language, projectid, name, path});
    createFolder(name, path);
    registerFileTree();
  }

  addfile.onclick = (e) => {
    let name = prompt("File Name?");
    let path = prompt("Path?");
    if (!name)
      return;
    socket.emit("AddFile", {language, projectid, name, path});  
    createFile(name, path);
    registerFileTree();
  }

  removefile.onclick = (e) => {
    let path = prompt("Path of File?");

    if (!path) return;

    if (path && path[0] == "/") path.substring(1);

    let patharr = path.split("/");
    let prevfolder = patharr[patharr.length-2];
    let filename = patharr[patharr.length-1];

    let pathnode = document.querySelectorAll(`[foldername="${prevfolder}"]`);
    if (!filename) return;
    if (patharr.length == 1) {
      treeroot.querySelector(`[filename="${filename}"]`).remove();
      if (treeroot.querySelector(`[filename="${filename}"]`)) {
        treeroot.querySelector(`[filename="${filename}"]`).remove();
      }
      socket.emit("RemoveFile", {projectid, path});
      return;
    };

    for (let i = 0; i < pathnode.length; i++) {
      let filer = pathnode[i].querySelector(`[filename="${filename}"]`);
      if (filer) {
        filer.remove();
        if (pathnode[i].querySelector(`[filename="${filename}"]`)) {
          pathnode[i].querySelector(`[filename="${filename}"]`).remove();
        }
        socket.emit("RemoveFile", {projectid, path});
        break;
      }
    }
  }

  removefolder.onclick = (e) => {
    let path = prompt("Path of Folder?");

    if (!path) return;

    if (path && path[0] == "/") path.substring(1);

    let patharr = path.split("/");
    let prevfolder = patharr[patharr.length-2];
    let foldername = patharr[patharr.length-1];

    let pathnode = document.querySelectorAll(`[foldername="${prevfolder}"]`);
    if (!foldername) return;
    if (patharr.length == 1) {
      let foldernode = treeroot.querySelector(`[foldername="${foldername}"]`);
      foldernode.parentElement.remove();
      if (treeroot.querySelector(`[foldername="${foldername}"]`)) {
        treeroot.querySelector(`[foldername="${foldername}"]`).parentElement.remove();
      }
      socket.emit("RemoveFolder", {projectid, path});
      return;
    };

    for (let i = 0; i < pathnode.length; i++) {
      let folderul = pathnode[i].querySelector(`[foldername="${foldername}"]`);
      let foldernode = folderul.parentElement;
      if (file) {
        foldernode.remove();
        if (pathnode[i].querySelector(`[foldername="${foldername}"]`)) {
          pathnode[i].querySelector(`[foldername="${foldername}"]`).parentElement.remove();
        }
        socket.emit("RemoveFolder", {projectid, path});
        break;
      }
    }
  }

  /*
    Example Tree:
    <ul class="root">
      <li class="folder-node">
        <div class="folder"><img src="../icons/icon-folder-blue.svg" />js</div>
        <ul class="nested">
          <li class="file-node">
            <div class="file"><img src="../icons/icon-jslogo.svg" />script.js</div>
          </li>
        </ul>
      </li>
      <li class="file-node">
        <div class="file"><img src="../icons/icon-jslogo.svg" />index.js</div>
      </li>
    </ul>
  */

  //document.getElementById();

  async function createFileHtml(name, ext, element, directory) {
    // if (!ext || !exts.includes(ext)) ext = "txt";
    if (name[0] == ".") return;
    if (element) {
      let node = createEl('li');
      node.className = "file-node";
      node.setAttribute('filename', name);

      let file = createEl("div");
      file.className = "file";

      let img = createEl("img");
      if (!exts.includes(ext)) {
        img.src = "../icons/icon-filelogo.svg";
        img.setAttribute("style", "transform: scale(2)");
      } else {
        img.src = "../icons/icon-" + ext + "logo.svg";
      }

      directory = directory.join('/');
      if (directory[0] == "/") directory = directory.substring(1);

      //https://codingio--theboys619.repl.co/projects/2.b73ead0c7034/node_modules
      if (!models.hasOwnProperty(directory))
        models[directory] = {};
      models[directory][name] = { cd: directory, name, model: monaco.editor.createModel('', types[ext], monaco.Uri.parse(`file:///${directory}/${name}`)) };
      models[directory][name].model.updateOptions({ tabSize: 2 });
      addLib(await getCode(`/${projectid}/${directory}/${name}`), `/${projectid}/${directory}/${name}`, name, directory);

      file.append(img);
      file.append(name);
      node.append(file);
      element.append(node);

      node.addEventListener('click', () => {
        openFile(name, directory, models[directory][name]);
      });
    } else {
      let node = createEl('li');
      node.className = "file-node";
      node.setAttribute('filename', name);

      let file = createEl("div");
      file.className = "file";

      let img = createEl("img");
      if (!exts.includes(ext)) {
        img.src = "../icons/icon-filelogo.svg";
        img.setAttribute("style", "transform: scale(2)");
      } else {
        img.src = "../icons/icon-" + ext + "logo.svg";
      }

      models[name] = { cd: "", name, model: monaco.editor.createModel('', types[ext], monaco.Uri.parse(`file:///${name}`)) };
      models[name].model.updateOptions({ tabSize: 2 });
      addLib(await getCode(`/${projectid}/${name}`), `/${projectid}/${name}`, name);

      file.append(img);
      file.append(name);
      node.append(file);
      treeroot.append(node);

      node.addEventListener('click', () => {
        openFile(name)
      });
    }
  }

  function createFolderHtml(name, element) {
    if (element) {
      let node = createEl('li');
      node.className = "folder-node";

      let file = createEl("div");
      file.className = "folder";

      let img = createEl("img");
      img.src = "../icons/../icons/icon-folder-blue.svg";

      let ul = createEl("ul");
      ul.className = "nested";
      ul.setAttribute('foldername', name);

      file.append(img);
      file.append(name);
      node.append(file);
      node.append(ul);
      element.append(node);
    } else {
      let node = createEl('li');
      node.className = "folder-node";

      let file = createEl("div");
      file.className = "folder";

      let img = createEl("img");
      img.src = "../icons/../icons/icon-folder-blue.svg";

      let ul = createEl("ul");
      ul.className = "nested";
      ul.setAttribute('foldername', name);

      file.append(img);
      file.append(name);
      node.append(file);
      node.append(ul);
      treeroot.append(node);
    }
  }

  function createEl(elm) {
    return document.createElement(elm);
  }

  function createFile(name, path) {
    let ext = name.substring(name.search(/[.]+.*/)+1);
    if (!path) {
      createFileHtml(name, ext);
    } else {
      let directory = path.split('/');
      if (directory[0] == 'undefined' || !directory[0]) {
        directory.splice(0, 1);
      }
      let foldername = directory[directory.length-1];
      let cd = document.querySelector(`[foldername="${foldername}"]`);

      createFileHtml(name, ext, cd, directory);
    }
  }

  function createFolder(name, path) {
    if (!path) {
      createFolderHtml(name);
    } else {
      let directory = path.split('/');
      if (directory[0] == 'undefined' || !directory[0]) {
        directory.splice(0, 1);
      }
      let foldername = directory[directory.length-1];
      let cd = document.querySelector(`[foldername="${foldername}"`);

      createFolderHtml(name, cd);
    }
    registerFileTree();
  }

  // ["index.js", {js: ["script.js"]}]
  const hiddendirs = ["node_modules"]

  function readDir(directory, path) {
    for (let item of directory) {
      if (typeof item == "object") {
        let folder = Object.keys(item)[0];
        if (hiddendirs.includes(folder) || path && path.includes("node_modules")) { readDir(item[folder], path + '/' + folder); continue }
        createFolder(folder, path);
        readDir(item[folder], path + '/' + folder);
      } else {
        // if (path && path.includes("@types/")) {
        //   let folders = path.split("/");
        //   getTypes(folders[folders.indexOf("@types")+1]);
        // }
        if (path && path.includes("node_modules")) continue;
        createFile(item, path);
      }
    }
    registerFileTree();
  }

  readDir(dir);

  getCode(file).then(data => {
    let type = "";
    if (mainfile.match(/[.]+.*/)) {
      let ext = mainfile.substring(mainfile.search(/[.]+.*/)+1);
      type = types[ext]
    }
    if (models.hasOwnProperty(mainfile)) {
      model = models[mainfile];
    } else {
      models[mainfile] = { cd: "", name: mainfile, model: monaco.editor.createModel('', type, monaco.Uri.parse(`file:///${mainfile}`))};
      model = models[mainfile];
    }

    window.editor.setModel(model.model);
    window.editor.setValue(data);
  });

  changeTheme();

  // for (let item of dir) {
  //   if (typeof item == "object") {
  //     createFolder
  //   } else {

  //   }
  // }


}