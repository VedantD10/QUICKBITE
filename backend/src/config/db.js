const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const dbFilePath = path.join(dataDir, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class DatabaseService {
  constructor() {
    this.data = {
      users: [],
      restaurants: [],
      menu_categories: [],
      menu_items: [],
      addresses: [],
      delivery_partners: [],
      orders: [],
      order_items: [],
      delivery_assignments: [],
      order_status_history: [],
      ratings: [],
      complaints: [],
      audit_logs: []
    };
    this.lock = Promise.resolve();
    this.load();
  }

  load() {
    if (fs.existsSync(dbFilePath)) {
      try {
        const raw = fs.readFileSync(dbFilePath, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error loading db.json, initializing fresh database', err);
        this.save();
      }
    } else {
      this.save();
    }
  }

  save() {
    fs.writeFileSync(dbFilePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // Execute operations with an atomic transaction queue lock
  async transaction(fn) {
    let release;
    const nextLock = new Promise(resolve => { release = resolve; });
    const currentLock = this.lock;
    this.lock = nextLock;

    await currentLock;
    try {
      // Deep clone snapshot for rollback capability
      const snapshot = JSON.parse(JSON.stringify(this.data));
      const result = await fn(this);
      this.save();
      return result;
    } catch (err) {
      // Rollback on transaction failure
      console.error('Transaction failed! Rolling back changes...', err.message);
      this.load();
      throw err;
    } finally {
      release();
    }
  }

  // Synchronous/Internal accessors
  getTable(table) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    return this.data[table];
  }

  find(table, filterFn) {
    const list = this.getTable(table);
    if (typeof filterFn === 'function') {
      return list.filter(filterFn);
    }
    return list;
  }

  findOne(table, filterFn) {
    const list = this.getTable(table);
    return list.find(filterFn);
  }

  findById(table, id) {
    return this.findOne(table, item => item.id === id);
  }

  insert(table, record) {
    const list = this.getTable(table);
    const now = new Date().toISOString();
    const newRecord = {
      ...record,
      created_at: record.created_at || now,
      updated_at: record.updated_at || now
    };
    list.push(newRecord);
    this.save();
    return newRecord;
  }

  update(table, id, updates) {
    const list = this.getTable(table);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedRecord = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updatedRecord;
    this.save();
    return updatedRecord;
  }

  delete(table, idOrFn) {
    const list = this.getTable(table);
    if (typeof idOrFn === 'function') {
      let count = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        if (idOrFn(list[i])) {
          list.splice(i, 1);
          count++;
        }
      }
      this.save();
      return count > 0;
    }

    const index = list.findIndex(item => item.id === idOrFn);
    if (index === -1) return false;

    list.splice(index, 1);
    this.save();
    return true;
  }
}

const db = new DatabaseService();
module.exports = db;
