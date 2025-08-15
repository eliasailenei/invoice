// db.js (ES module)
const DB_NAME = 'invoicer';
const DB_VER  = 2;

export const STORES = {
  invoices: 'invoices',
  settings: 'settings',
  clients:  'clients',
  files:    'files'
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.invoices)) {
        const os = db.createObjectStore(STORES.invoices, { keyPath: 'id' });
        os.createIndex('createdAt', 'createdAt');
        os.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.clients)) {
        const cs = db.createObjectStore(STORES.clients, { keyPath: 'id' });
        cs.createIndex('name', 'name');
      }
      if (!db.objectStoreNames.contains(STORES.files)) {
        const fs = db.createObjectStore(STORES.files, { keyPath: 'id' });
        fs.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Settings
export async function getSetting(key, fallback = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.settings, 'readonly');
    const r = tx.objectStore(STORES.settings).get(key);
    r.onsuccess = () => resolve(r.result?.value ?? fallback);
    r.onerror = () => reject(r.error);
  });
}
export async function setSetting(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.settings, 'readwrite');
    tx.objectStore(STORES.settings).put({ key, value });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// Invoices
export async function putInvoice(inv) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.invoices, 'readwrite');
    tx.objectStore(STORES.invoices).put(inv);
    tx.oncomplete = () => resolve(inv.id);
    tx.onerror = () => reject(tx.error);
  });
}
export async function getInvoice(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.invoices, 'readonly');
    const r = tx.objectStore(STORES.invoices).get(id);
    r.onsuccess = () => resolve(r.result ?? null);
    r.onerror = () => reject(r.error);
  });
}
export async function listInvoices() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.invoices, 'readonly');
    const r = tx.objectStore(STORES.invoices).getAll();
    r.onsuccess = () => resolve(
      (r.result || []).sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''))
    );
    r.onerror = () => reject(r.error);
  });
}
export async function deleteInvoice(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.invoices, 'readwrite');
    tx.objectStore(STORES.invoices).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// Clients
export async function listClients() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.clients, 'readonly');
    const r = tx.objectStore(STORES.clients).getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}
export async function putClient(client) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.clients, 'readwrite');
    tx.objectStore(STORES.clients).put(client);
    tx.oncomplete = () => resolve(client.id);
    tx.onerror = () => reject(tx.error);
  });
}
export async function deleteClient(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.clients, 'readwrite');
    tx.objectStore(STORES.clients).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// Files (photos)
export async function putFile(rec) { // {id, blob, name, type, createdAt}
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORES.files, 'readwrite');
    tx.objectStore(STORES.files).put(rec);
    tx.oncomplete = () => res(rec.id);
    tx.onerror = () => rej(tx.error);
  });
}
export async function getFile(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORES.files, 'readonly');
    const r = tx.objectStore(STORES.files).get(id);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
}
export async function deleteFile(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORES.files, 'readwrite');
    tx.objectStore(STORES.files).delete(id);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}

// Utils
export const uid = (p='inv') =>
  `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
