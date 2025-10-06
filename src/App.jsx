import { useMemo, useState, useEffect } from "react";
import MacroForm from "./components/MacroForm.jsx";
import MacroTable from "./components/MacroTable.jsx";
import Searchbar from "./components/Searchbar.jsx";
import Pagination from "./components/Pagination.jsx";
import { loadItems, saveItems } from "./utils/storage.js";

export default function App() {
  // Load once, synchronously, from localStorage
  const [items, setItems] = useState(() => loadItems());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ by: "item", dir: "asc" });
  const [editing, setEditing] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Backup persistence if anything somehow bypassed the handlers
  useEffect(() => {
    saveItems(items);
  }, [items]);

  // Reset page on filter/sort/data changes
  useEffect(() => {
    setPage(1);
  }, [query, sort.by, sort.dir, items.length]);

  // ----- CRUD with immediate persistence -----
  function handleSubmit(data) {
    if (editing) {
      const next = items.map((it) => (it.id === data.id ? data : it));
      saveItems(next);            // write first
      setItems(next);             // then update state
      setEditing(null);
    } else {
      const next = [...items, data];
      saveItems(next);
      setItems(next);
    }
  }

  function handleDelete(id) {
    const next = items.filter((it) => it.id !== id);
    saveItems(next);
    setItems(next);
    if (editing?.id === id) setEditing(null);
  }
  // ------------------------------------------

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      (r.item || "").toLowerCase().includes(q) ||
      (r.model || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.vendor || "").toLowerCase().includes(q) ||
      (r.notes || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const { by, dir } = sort;
    const mul = dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (by === "item")   return (a.item   || "").localeCompare(b.item   || "") * mul;
      if (by === "vendor") return (a.vendor || "").localeCompare(b.vendor || "") * mul;
      return 0;
    });
    return list;
  }, [filtered, sort]);

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  return (
    <div className="container">
      <header className="header">
        <h1>Macro Items</h1>
      </header>

      <section className="panel">
        <MacroForm
          key={editing?.id || "new"}
          editingItem={editing}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditing(null)}
        />
      </section>

      <section className="panel">
        <div className="toolbar">
          <Searchbar query={query} setQuery={setQuery} count={total} />
          <div className="row gap">
            <label className="hint">Sort by</label>
            <select
              value={sort.by}
              onChange={(e) => setSort((s) => ({ ...s, by: e.target.value }))}
            >
              <option value="item">Item</option>
              <option value="vendor">Vendor</option>
            </select>
            <button
              className="btn"
              onClick={() =>
                setSort((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))
              }
              title={`Toggle ${sort.dir}`}
            >
              {sort.dir === "asc" ? "Asc ⬆" : "Desc ⬇"}
            </button>
          </div>
        </div>

        <MacroTable items={pageItems} onEdit={setEditing} onDelete={handleDelete} />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          setPage={setPage}
          setPageSize={setPageSize}
        />
      </section>
    </div>
  );
}
