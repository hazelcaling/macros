const KEY = "macroItems.v1";

export function loadItems() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadItems failed:", e);
    return [];
  }
}

export function saveItems(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    console.error("saveItems failed:", e);
  }
}
