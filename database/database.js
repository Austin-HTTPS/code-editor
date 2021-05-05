const fs = require('fs');
class Collection {
  constructor(db, name) {
    this.db = db;
    this.name = name;
    this.data = {};
  }

  Set(key, data) {
    this.data[key] = data || {};
    if (this.db.autosave) {
      this.Save();
    }
  }

  Save() {
    this.db.data[this.name] = this.data;
    this.db.Save();
  }

  Get(key) {
    this.db.Refresh();

    return this.data[key];
  }

  Delete(key) {
    delete this.data[key];

    if (this.db.autosave) {
      this.Save();
    }
  }

  Clear() {
    this.data = {};

    if (this.db.autosave) {
      this.Save();
    }
  }
}

class db {
  constructor(filepath, autosave, spacing) {
    this.filepath = filepath;
    this.autosave = autosave;
    this.spacing = spacing;
    this.data = {};

    this.Collections = [];
  }

  Refresh() {
    this.data = JSON.parse(fs.readFileSync(this.filepath));

    for (let collection of this.Collections) {
      collection.data = this.data[collection.name] || {};
    }
  }

  Save() {
    fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, this.spacing));
  }

  Create(key) {
    let collection = new Collection(this, key);
    this.Collections.push(collection);

    return collection;
  }

  Delete(name) {
    this.Collections.splice(this.Collections.indexOf(this.data[name]), 1);
    delete this.data[name];
  }

  Clear(key) {
    for (let col of this.Collections) {
      if (col.name == key) {
        col.Clear();
      }
    }
  }
}

function newDb(filepath, autosave, spacing) {
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify({}, null, spacing));
  }
  return new db(filepath, autosave, spacing);
}

module.exports = newDb;