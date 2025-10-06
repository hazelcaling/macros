export default function Pagination({ page, pageSize, total, setPage, setPageSize }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const clamp = (n) => Math.min(pages, Math.max(1, n));

  const numbers = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
      numbers.push(i);
    } else if (numbers[numbers.length - 1] !== "...") {
      numbers.push("...");
    }
  }

  return (
    <div className="pagination">
      <div className="row gap">
        <label className="row gap-s">
          <span className="hint">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>

        <div className="pager">
          <button className="btn" onClick={() => setPage(clamp(page - 1))} disabled={page <= 1}>
            Prev
          </button>

          {numbers.map((n, idx) =>
            n === "..." ? (
              <span key={idx} className="dots">…</span>
            ) : (
              <button
                key={idx}
                className={`btn page${n === page ? " active" : ""}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            )
          )}

          <button className="btn" onClick={() => setPage(clamp(page + 1))} disabled={page >= pages}>
            Next
          </button>
        </div>

        <div className="hint">
          {(total === 0) ? "0–0 of 0" :
            `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </div>
      </div>
    </div>
  );
}
