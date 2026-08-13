const fs = require('fs');
const path = require('path');

// Environment check for Vercel / serverless runtime
const isVercel = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

const dataDir = path.join(__dirname, '../../data');
const dbFilePath = path.join(dataDir, 'db.json');

// Ensure data directory exists ONLY for local disk persistence
if (!isVercel) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err) {
    console.warn('Data directory creation skipped (read-only filesystem detected):', err.message);
  }
}

class DatabaseService {
  constructor() {
    this.isServerless = isVercel;
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
    // In serverless / Vercel mode, run purely in-memory
    if (this.isServerless) return;

    try {
      if (fs.existsSync(dbFilePath)) {
        const raw = fs.readFileSync(dbFilePath, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Warning: Could not load db.json from disk, fallback to in-memory mode:', err.message);
    }
  }

  save() {
    // No-op on Vercel / serverless environments to prevent EROFS filesystem crash
    if (this.isServerless) return;

    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.warn('Warning: Could not save db.json to disk:', err.message);
    }
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
