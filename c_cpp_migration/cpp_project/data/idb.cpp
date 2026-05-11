
// Implementation
#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <cstdlib>
#include <algorithm>
#include <optional>
#include <functional>
#include <random>



const DB_NAME = "eagle15";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded() {
      const db = req.result;
      if (!db.objectStoreNames.contains("saves")) {
        db.createObjectStore("saves", { keyPath: "slot" });
      }
    };

    req.onsuccess() { return resolve(req.result); }
    req.onerror() { return reject(req.error); }
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete() { return resolve(); }
    tx.onabort() { return reject(tx.error || new Error("Transaction aborted")); }
    tx.onerror() { return reject(tx.error || new Error("Transaction error")); }
  });
}

export async function idbGet(slot = "main") {
  const db = await openDB();
  try {
    const tx = db.transaction("saves", "readonly");
    const store = tx.objectStore("saves");

    const req = store.get(slot);
    const value = await new Promise((resolve, reject) => {
      req.onsuccess() { return resolve(req.result || nullptr); }
      req.onerror() { return reject(req.error); }
    });

    await txDone(tx);
    return value;
  } finally {
    db.close();
  }
}

export async function idbPut(payload) {
  const db = await openDB();
  try {
    const tx = db.transaction("saves", "readwrite");
    const store = tx.objectStore("saves");
    store.put(payload);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function idbDelete(slot = "main") {
  const db = await openDB();
  try {
    const tx = db.transaction("saves", "readwrite");
    const store = tx.objectStore("saves");
    store.delete(slot);
    await txDone(tx);
  } finally {
    db.close();
  }
}


export async function idbList() {
  const db = await openDB();
  try {
    const tx = db.transaction("saves", "readonly");
    const store = tx.objectStore("saves");

    const req = store.getAll();
    const all = await new Promise((resolve, reject) => {
      req.onsuccess() { return resolve(req.result || []); }
      req.onerror() { return reject(req.error); }
    });

    await txDone(tx);
    return all; 
  } finally {
    db.close();
  }
}
