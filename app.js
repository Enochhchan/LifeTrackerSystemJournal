// IndexedDB Database Setup
const DB_NAME = 'HabitJournalDB';
const DB_VERSION = 2; // Incremented for new stores
const STORE_HABITS = 'habits';
const STORE_ENTRIES = 'entries';
const STORE_PREFERENCES = 'preferences';

let db = null;

// Initialize database
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      // Create habits store
      if (!db.objectStoreNames.contains(STORE_HABITS)) {
        const habitsStore = db.createObjectStore(STORE_HABITS, { keyPath: 'id', autoIncrement: true });
        habitsStore.createIndex('name', 'name', { unique: false });
      }

      // Create entries store
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const entriesStore = db.createObjectStore(STORE_ENTRIES, { keyPath: 'date' });
        entriesStore.createIndex('date', 'date', { unique: true });
      }

      // Create preferences store (version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains(STORE_PREFERENCES)) {
        const prefsStore = db.createObjectStore(STORE_PREFERENCES, { keyPath: 'key' });
      }
    };
  });
}

// Habit CRUD operations
async function addHabit(name) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HABITS], 'readwrite');
    const store = transaction.objectStore(STORE_HABITS);
    const habit = {
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    const request = store.add(habit);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateHabit(id, name) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HABITS], 'readwrite');
    const store = transaction.objectStore(STORE_HABITS);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const habit = getRequest.result;
      if (habit) {
        habit.name = name.trim();
        const updateRequest = store.put(habit);
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error('Habit not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

async function deleteHabit(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HABITS], 'readwrite');
    const store = transaction.objectStore(STORE_HABITS);
    const request = store.delete(id);
    request.onsuccess = () => {
      // Also remove from all entries
      removeHabitFromEntries(id).then(resolve).catch(reject);
    };
    request.onerror = () => reject(request.error);
  });
}

async function removeHabitFromEntries(habitId) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ENTRIES], 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const entry = cursor.value;
        if (entry.habitCompletions && entry.habitCompletions[habitId]) {
          delete entry.habitCompletions[habitId];
          cursor.update(entry);
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

async function getHabits() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HABITS], 'readonly');
    const store = transaction.objectStore(STORE_HABITS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Entry CRUD operations
async function saveEntry(date, entryData) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ENTRIES], 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const entry = {
      date: date,
      mood: entryData.mood || null,
      highlight: entryData.highlight || '',
      journal: entryData.journal || '',
      screenTime: entryData.screenTime || null,
      weight: entryData.weight || null,
      habitCompletions: entryData.habitCompletions || {}
    };
    const request = store.put(entry);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getEntry(date) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ENTRIES], 'readonly');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.get(date);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function getAllEntries() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ENTRIES], 'readonly');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Preferences operations
async function getPreferences() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PREFERENCES], 'readonly');
    const store = transaction.objectStore(STORE_PREFERENCES);
    const request = store.getAll();
    request.onsuccess = () => {
      const prefs = {};
      request.result.forEach(item => {
        prefs[item.key] = item.value;
      });
      // Default preferences
      const defaults = {
        showScreenTime: false,
        showWeight: false,
        showHabits: false,
        promptMoodOnOpen: true,
        userName: '',
        topHabits: [null, null, null],
        theme: 'light',
        habitOrder: []
      };
      resolve({ ...defaults, ...prefs });
    };
    request.onerror = () => reject(request.error);
  });
}

async function setPreference(key, value) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PREFERENCES], 'readwrite');
    const store = transaction.objectStore(STORE_PREFERENCES);
    const pref = { key, value };
    const request = store.put(pref);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function setPreferences(prefs) {
  if (!db) await initDB();
  const promises = Object.entries(prefs).map(([key, value]) => setPreference(key, value));
  return Promise.all(promises);
}

// Export/Import
async function exportData() {
  const habits = await getHabits();
  const entries = await getAllEntries();
  const preferences = await getPreferences();
  return {
    version: 2,
    exportDate: new Date().toISOString(),
    habits: habits,
    entries: entries,
    preferences: preferences
  };
}

async function importData(json) {
  if (!db) await initDB();
  
  // Validate structure
  if (!json.habits || !json.entries) {
    throw new Error('Invalid import format');
  }

  // Clear existing data
  const habitsTransaction = db.transaction([STORE_HABITS], 'readwrite');
  const habitsStore = habitsTransaction.objectStore(STORE_HABITS);
  await new Promise((resolve, reject) => {
    const clearRequest = habitsStore.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
  });

  const entriesTransaction = db.transaction([STORE_ENTRIES], 'readwrite');
  const entriesStore = entriesTransaction.objectStore(STORE_ENTRIES);
  await new Promise((resolve, reject) => {
    const clearRequest = entriesStore.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
  });

  const prefsTransaction = db.transaction([STORE_PREFERENCES], 'readwrite');
  const prefsStore = prefsTransaction.objectStore(STORE_PREFERENCES);
  await new Promise((resolve, reject) => {
    const clearRequest = prefsStore.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
  });

  // Import habits
  for (const habit of json.habits) {
    await new Promise((resolve, reject) => {
      const request = habitsStore.add(habit);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Import entries
  for (const entry of json.entries) {
    await new Promise((resolve, reject) => {
      const request = entriesStore.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Import preferences if available
  if (json.preferences) {
    await setPreferences(json.preferences);
  }
}

// Stats calculations
async function calculateHabitStats(habitId, days = 30) {
  const entries = await getAllEntries();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const relevantEntries = entries.filter(e => e.date >= cutoffStr);
  const completed = relevantEntries.filter(e => e.habitCompletions && e.habitCompletions[habitId]).length;
  const total = relevantEntries.length;
  const rate = total > 0 ? (completed / total) * 100 : 0;

  return { completed, total, rate: Math.round(rate) };
}

async function calculateHabitStreak(habitId) {
  const entries = await getAllEntries();
  const sortedEntries = entries
    .filter(e => e.habitCompletions && e.habitCompletions[habitId])
    .map(e => e.date)
    .sort()
    .reverse();

  if (sortedEntries.length === 0) return { current: 0, longest: 0 };

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  let checkDate = today;
  
  for (const entryDate of sortedEntries) {
    if (entryDate === checkDate) {
      currentStreak++;
      const date = new Date(checkDate);
      date.setDate(date.getDate() - 1);
      checkDate = date.toISOString().split('T')[0];
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 1;
  let currentLongest = 1;
  for (let i = 1; i < sortedEntries.length; i++) {
    const prevDate = new Date(sortedEntries[i - 1]);
    const currDate = new Date(sortedEntries[i]);
    const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentLongest++;
      longestStreak = Math.max(longestStreak, currentLongest);
    } else {
      currentLongest = 1;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

async function getMoodTrend(days = 30) {
  const entries = await getAllEntries();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  return entries
    .filter(e => e.date >= cutoffStr && e.mood !== null && e.mood !== undefined)
    .map(e => ({ date: e.date, mood: e.mood }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getJournalConsistency() {
  return getAllEntries().then(entries => {
    const journaled = entries.filter(e => e.journal && e.journal.trim().length > 0).length;
    const total = entries.length;
    const rate = total > 0 ? Math.round((journaled / total) * 100) : 0;
    
    // Calculate total word count
    const totalWords = entries
      .filter(e => e.journal && e.journal.trim().length > 0)
      .reduce((sum, e) => {
        const words = e.journal.trim().split(/\s+/).filter(w => w.length > 0);
        return sum + words.length;
      }, 0);
    
    // Calculate longest streak
    const sortedEntries = entries
      .filter(e => e.journal && e.journal.trim().length > 0)
      .map(e => e.date)
      .sort()
      .reverse();
    
    let longestStreak = 0;
    if (sortedEntries.length > 0) {
      let currentStreak = 1;
      longestStreak = 1;
      
      for (let i = 1; i < sortedEntries.length; i++) {
        const prevDate = new Date(sortedEntries[i - 1] + 'T00:00:00');
        const currDate = new Date(sortedEntries[i] + 'T00:00:00');
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
    }
    
    return { total, journaled, rate, totalWords, longestStreak };
  });
}

async function getMostConsistentHabits() {
  const habits = await getHabits();
  const entries = await getAllEntries();
  
  const habitStats = await Promise.all(
    habits.map(async (habit) => {
      const stats = await calculateHabitStats(habit.id, 30);
      return { habit, rate: stats.rate };
    })
  );

  return habitStats
    .filter(h => h.rate > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);
}

async function getWeightTrend(days = 30) {
  const entries = await getAllEntries();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  return entries
    .filter(e => e.date >= cutoffStr && e.weight !== null && e.weight !== undefined)
    .map(e => ({ date: e.date, weight: e.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Utility functions
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

