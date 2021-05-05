const sizercc = document.getElementById("container-console");
const fileview = document.getElementById("files");
const terminal = document.getElementById("terminal");

require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});
require(['vs/editor/editor.main'], async function() {
  monaco.editor.defineTheme('dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { background: '0b1226' },
        { token: "keyword", foreground: "3074c2" }
      ],
      colors: {
          "editor.background": "#0b1226",
          "editor.selectionBackground": "#205085"
      }
  });

  monaco.editor.defineTheme('light', {
      base: 'vs',
      inherit: true,
      rules: [
        { background: 'e6e6f2' },
        { token: "keyword", foreground: "121ac7" }
      ],
      colors: {
          "editor.background": "#e6e6f2",
          "editor.selectionBackground": "#205085"
      }
  });

  let theme = localStorage.getItem("theme");
  if (theme == "dark") {
    monaco.editor.setTheme("dark");
  } else {
    monaco.editor.setTheme("light");
  }

  // if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  //   monaco.editor.setTheme('dark');
  // } else {
  //   monaco.editor.setTheme('light');
  // }

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false
  });

  // compiler options
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowJs: true,
    typeRoots: ["/types", `/projects`]
  });

  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

  getTypes(language);

  // let model = monaco.editor.createModel(code, "javascript");
  // model.updateOptions({ tabSize: 2 })

  term.element.style.width = (window.innerWidth - sizercc.getBoundingClientRect().x) + "px";
  term.resize(Math.floor(term.element.clientWidth/9.174311926605505)-2, Math.floor(window.innerHeight/17));
  terminal.style.width = (window.innerWidth - sizercc.getBoundingClientRect().x) + "px";
  container.style.width = sizercc.getBoundingClientRect().x - fileview.getBoundingClientRect().width + "px";
  

  monaco.editor.onDidCreateEditor(loadscripts);

  window.editor = monaco.editor.create(container, {
      scrollBeyondLastLine: false,
      scrollbar: {
        // Subtle shadows to the left & top. Defaults to true.
        useShadows: false,

        // Render vertical arrows. Defaults to false.
        verticalHasArrows: false,
        // Render horizontal arrows. Defaults to false.
        horizontalHasArrows: false,

        // Render vertical scrollbar.
        // Accepted values: 'auto', 'visible', 'hidden'.
        // Defaults to 'auto'
        vertical: 'visible',
        // Render horizontal scrollbar.
        // Accepted values: 'auto', 'visible', 'hidden'.
        // Defaults to 'auto'
        horizontal: 'visible',

        verticalScrollbarSize: 13,
        horizontalScrollbarSize: 13
        // arrowSize: 30
      },
      model: null
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').onchange = (e) => {
      if (e.matches) {
        monaco.editor.setTheme("dark");
      } else {
        monaco.editor.setTheme("light");
      }
    }
  }

  window.editor.setTheme = monaco.editor.setTheme;

  window.onresize = () => {
    term.element.style.width = (window.innerWidth - sizercc.getBoundingClientRect().x) + "px";
    term.resize(Math.floor(term.element.clientWidth/9.174311926605505)-2, Math.floor(window.innerHeight/17));
    terminal.style.width = (window.innerWidth - sizercc.getBoundingClientRect().x) + "px";
    container.style.width = sizercc.getBoundingClientRect().x - fileview.getBoundingClientRect().width + "px";
    let width = container.clientWidth;
    let height = container.clientHeight;
    window.editor.layout({ width, height });
  }

  function resizeElements(sizerccx) {
    terminal.style.width = (window.innerWidth - sizercc.getBoundingClientRect().x) + "px";
    term.element.style.width = (window.innerWidth - sizercc.getBoundingClientRect().x) + "px";
    term.resize(Math.floor(term.element.clientWidth/9.174311926605505)-2, Math.floor(window.innerHeight/17));
    container.style.width = sizerccx + "px";
    // terminal.style.left = sizercc.getBoundingClientRect().x + "px";
    window.editor.layout();
  }

  let sizers = document.getElementsByClassName("sizer");
  let move = false;
  let sizer = "";
  let mousedownlistener = (e) => {
    if (e.target.classList[0] == "sizer" || e.target.tagName == "P") {
      if (e.target.tagName == "P") {
        sizer = e.target.parentElement;
      } else {
        sizer = e.target;
      }
    }

    move = true;
  }
  let mouseuplistener = (e) => {
    move = false;

    if (sizer == sizercc) {
      resizeElements(sizercc.getBoundingClientRect().x - fileview.getBoundingClientRect().width);
      sizer = "";
    }
  }

  for (let i in sizers) {
    if (sizers[i] instanceof HTMLElement) {
      sizers[i].addEventListener("mousedown", mousedownlistener);
    }
  }

  function size(e) {
    if (move) {
      if (e.clientX > window.innerWidth * .70) {
        sizer.style.left = (window.innerWidth * .70) + "px";
      } else {
        sizer.style.left = e.clientX - 4 + "px";
      }
    }
  }

  document.addEventListener("mousemove", size);

  document.addEventListener('mouseup', mouseuplistener);


  // Monaco Action Binds //

  editor.addAction({
    id: "Download Package",
    label: "Download a package!",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.US_SLASH
    ],
    run: function(ed) {
      let packager;
      if (language == "node") packager = "npm";
      if (language == "python") packager = "pip";
      let cmd = prompt("Download package from?", packager);

      if (!cmd) return;
      
      socket.emit("Download PKG", {cmd, projectid});
    }
  });
});

// Other Javascript //

window.addEventListener("beforeunload", (e) => {
  let msg = "Are you sure you want to leave?";
  e.returnValue = msg;
});