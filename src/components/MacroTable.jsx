export default function MacroTable({ items, onEdit, onDelete }) {
  if (!items.length) return <div className="empty">No items yet.</div>;

  const prettyMultiplier = (m) =>
    typeof m === "number" && !Number.isNaN(m) ? m.toFixed(2) : "—";

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Model</th>
            <th>Description</th>
            <th>Vendor</th>
            <th>Multiplier</th>
            <th>Notes</th>
            <th style={{ width: 140 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id}>
              <td>{row.item}</td>
              <td>{row.model}</td>
              <td className="cell-wrap">{row.description}</td>
              <td>{row.vendor}</td>
              <td>{prettyMultiplier(row.multiplier)}</td>
              <td className="cell-wrap">{row.notes}</td>
              <td className="actions-cell">
                <button className="btn" onClick={() => onEdit(row)}>Edit</button>
                <button
                  className="btn danger"
                  onClick={() => { if (confirm("Delete this item?")) onDelete(row.id); }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
