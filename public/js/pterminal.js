// Declarations //
let canv;
let pos = 25;
let scrollview = 0;

let lastx = 0;
let lasty = 0;
let screentextlen;

// p5.js Functions //

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (typeof this.events[event] == 'object') {
      this.events[event].push(listener);
    } else {
      this.events[event] = [];
      this.events[event].push(listener);
    }
  }

  once(event, listener) {
    let _t = this;
    this.on(event, function lis() {
      listener.apply(this, arguments);
      _t.off(event, lis);
    });
  }

  emit(event) {
    let args = Array.from(arguments)
    args.splice(0, 1);

    if (!this.events[event]) return;
    for (let listener of this.events[event]) {
      listener.apply(this, args);
    }
  }

  off(event, listener) {
    if (!this.events[event] || this.events[event] == []) return;

    let index = this.events[event].indexOf(listener);
    if (index >= 0) {
      this.events[event].splice(index, 1);
    }
  }
}

class Terminal extends EventEmitter {

  /**
   * @param {HTMLElement} element HTMLElement Instance
   */
  constructor(element, cols = 80, rows = 30) {
    super();
    if (!element) {
      console.error("No terminal element found! Cannot create terminal instance!");
      return;
    }
    this.div = element;
    this.div.style = "width: 800px; height: 600px";
    this.div.classList.add("terminal");

    this.canvas = null;
    this.p;

    this.terminal;

    // this.terminal = (p) => {
    //   p.setup = this.setup.bind(this, p);
    //   p.draw = this.draw.bind(this, p);
    //   this.p = p;
    // }

    // new p5(this.terminal, this.div);

    this.cols = cols;
    this.rows = rows;

    this.font = "monospace";
    this.fontname = "monospace";

    this.screen = { bgColor: 56, textColor: "rgba(250, 250, 250, 0.6)", fontSize: 15, text: [""], textPrefix: "", w: this.div.clientWidth, h: this.div.clientHeight };

    this.cursor = { x: 0, y: 0, w: 10, h: 20, color: this.screen.textColor, blinking: true, blinkrate: 525, blinktime: 200 };

    this.initListeners();
  }

  init(options) {
    if (typeof options == "object") {
      let optionslength = Object.keys(options).length;
      for (let key in options) {
        let val = options[key];
        switch (key) {
          case "prefix":
            this.setPrefix(val)
            this.screen.text[0] = val;
            this.cursor.x = val.length;
            break;
          case "backgroundColor":
            this.BackgroundColor(val)
            break;
          case "textColor":
            this.TextColor(val)
            break;
          case "cursorColor":
            this.CursorColor(val)
            break;
          case "font":
            this.on("Terminal Init", p => { 
              this.textFont(val);
            });
            break;
          case "fontSize":
            this.screen.fontSize = val
            break;
          case "width":
            this.div.style.width = `${val}px`
            this.cols = Math.floor(val / this.cursor.w)
            this.screen.w = val
            break;
          case "height":
            this.div.style.height = `${val}px`
            this.rows = Math.floor(val / this.cursor.h)
            this.screen.h = val
            break;
        }
      }
    }

    this.terminal = (p) => {
      p.setup = this.setup.bind(this, p);
      p.draw = this.draw.bind(this, p);
      p.mouseWheel = mousewheel.bind(this);
      this.p = p;
      this.emit("Terminal Init", p);
    }

    new p5(this.terminal, this.div);
  }

  initListeners() {
    document.addEventListener("keydown", (e) => {
      e.preventDefault();
      this.emit("keydown", e.keyCode, e.key);
    });

    document.addEventListener("keyup", (e) => {
      e.preventDefault();
      this.emit("keyup", e.keyCode, e.key);
    });

    document.addEventListener("keypress", (e) => {
      e.preventDefault();
      this.emit("key", e.keyCode, e.key);
    });
  }

  // Private Functions //

  #blinkCursor = (p) => {
    if (this.cursor.blinking) {
      p.fill(this.cursor.color);
      p.noStroke();
      p.rect(this.cursor.x * this.cursor.w, this.cursor.y * this.cursor.h, this.cursor.w, this.cursor.h)
    }

    if (p.millis() - this.cursor.blinkrate > this.cursor.blinktime) {
      this.cursor.blinktime = p.millis();
      this.cursor.blinking = !this.cursor.blinking;
    }
  }

  // ["Hello There", "New Line"]
  #drawText = (p) => {
    let screentext = this.screen.text;
    for (let y in screentext) {
      let line = parseInt(y);
      line += scrollview; // For Scrolling
      if (line >= 0) { // For Scrolling
        let text = screentext[line];
        p.textFont(this.font, this.screen.fontSize);
        this.canvas.elt.style.letterSpacing = `1px`; //Math.pow(p.textWidth("a"), 0.245).toFixed(6)
        p.text(text, 0, (line - scrollview) * this.cursor.h + 3, this.screen.w + this.cursor.w);
      }
      //(this.screen.h + this.cursor.h) - ((line * this.cursor.h) + 3)
    }
  }

  // Main Functions //

  setup(p) {
    this.canvas = p.createCanvas(this.div.clientWidth, this.div.clientHeight);
  }

  draw(p) {
    p.background(this.screen.bgColor);

    // this.#blinkCursor(p);

    p.textSize(this.screen.fontSize);
    p.fill(this.screen.textColor);
    // this.canvas.elt.style.letterSpacing = `3px`;
    this.#drawText(p);
  }

  // Other Methods //

  backspace(times, nop) {
    let end = this.screen.textPrefix.length;
    let screentextl = this.screen.text.length-1; // Replace this with this.cursor.y
    if (nop) end = 0;
    for (let i = 0; i < times; i++) {
      if (this.screen.text[screentextl] && this.screen.text[screentextl].includes(this.screen.textPrefix)) {
        if (this.cursor.x <= end) break;
      }

      if (screentextl > 0 && this.cursor.x <= 0) {
        screentextl--; // Remove
        this.cursor.y--;
        this.cursor.x = this.cols;
      }
      if (this.cursor.x > 0) {
        let text = this.screen.text[screentextl];
        this.screen.text[screentextl] = text.substr(0, text.length-1);
        this.cursor.x--;

        if (text.length == 1) this.screen.text.splice(screentextl, 1);
      }
    }
  }

  write(text, nop, exec) {
    if (text.includes("\b")) return this.backspace(text.split("\b").length-1, nop);
    let lines = text.split("\n");
    let linelength = lines.length;
    let screentextlen = this.screen.text.length-1; // anywhere where this is should be cursor.y
    let newy = this.cursor.y;

    for (let x in text) {
      this.cursor.x++;
    }

    if (typeof this.screen.text[screentextlen] != "string") this.screen.text.push("");
    this.screen.text[screentextlen] += lines[0];

    for (let i = 1; i < linelength; i++) {
      screentextlen++;
      this.cursor.y++;
      if (nop) {
        if (typeof this.screen.text[screentextlen] != "string") this.screen.text.push("");
      } else {
        if (typeof this.screen.text[screentextlen] != "string") this.screen.text.push(this.screen.textPrefix);
      }
      
      this.screen.text[screentextlen] += lines[i];
      this.cursor.x = this.screen.text[screentextlen].length;
    }

    this.cursor.blinktime = this.p.millis();
    if (this.cursor.x >= this.cols) {this.cursor.x = 0; screentextlen++; this.cursor.y++};
    this.cursor.blinking = true;

    lastx = this.cursor.x;
    lasty = screentextlen + scrollview;
  }

  // Configuration Changing //

  async textFont(font, fontname) {
    this.fontname = fontname;
    if (typeof font == "object") {
      this.font = font;
    } else {
      this.fontname = font.split("/")[font.split('/').length-1].substr(0, font.split("/")[font.split('/').length-1].indexOf("."));;
      this.p.loadFont(font, (f) => {
        setTimeout(() => {
          this.font = f;
        }, 200);
      });
    }
  }

  setPrefix(prefix) {
    this.screen.textPrefix = prefix;
  }

  BackgroundColor() {
    let args = Array.from(arguments);
    if (args.length > 3) return console.error("BG Color only allows 1 - 3 arguments");
    if (args.length == 1) {
      this.screen.bgColor = args[0];
    } else {
      this.screen.bgColor = args;
    }
    this.emit("bgcolorchange", args);
  }

  TextColor() {
    let args = Array.from(arguments);
    if (args.length > 3) return console.error("Text Color only allows 1 - 3 arguments");
    if (args.length == 1) {
      this.screen.textColor = args[0];
    } else {
      this.screen.textColor = args;
    }
    this.emit("textcolorchange", args);
  }

  CursorColor() {
    let args = Array.from(arguments);
    if (args.length > 3) return console.error("Cursor Color only allows 1 - 3 arguments");
    if (args.length == 1) {
      this.cursor.color = args[0];
    } else {
      this.cursor.color = args;
    }
    this.emit("cursorcolorchange", args);
  }

  resize(x, y) {
    this.p.resizeCanvas(x, y);
    this.div.style.width = `${x}px`;
    this.div.style.height = `${y}px`;
    this.screen.w = x;
    this.screen.h = y;

    this.cols = Math.floor(x / this.cursor.w);
    this.rows = Math.floor(y / this.cursor.h);
    this.screen.fontSize = this.cursor.w + 5;
    this.emit("resize", x, y, this.cols, this.rows);
  }
}

function mousewheel(event) {
  //println(event.delta);
  pos += event.delta;
  if (pos <= 25) {
    pos = 25;
    scrollview = 0;
    lasty = this.screen.text.length-1 + scrollview;
    this.cursor.y = this.screen.text.length-1 + scrollview;
  } else {
    scrollview = Math.floor(pos / 25);
    this.cursor.y = this.screen.text.length-1 - scrollview;
  }
}