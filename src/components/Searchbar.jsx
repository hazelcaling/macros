import { useMemo } from "react";

export default function Searchbar({ query, setQuery, count }) {
  const placeholder = useMemo(
    () => "Search by Item, Model, Description, Vendor, Notes",
    []
  );

  return (
    <div className="row">
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <div className="hint">
        {count} item{count === 1 ? "" : "s"}
      </div>
    </div>
  );
}
