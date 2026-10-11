import React, { useMemo, useState } from "react";
export default function DataTable({
  rows = [],
  columns,
  rowKey = "id",
  caption,
  loading = false,
  error = "",
  pageSize = 10,
  searchable = true,
  searchLabel = "Search",
  empty = "No records to display.",
}) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [sort, setSort] = useState(null);
  const filtered = useMemo(() => {
    const result = rows.filter(
      (row) =>
        !query ||
        columns.some((c) =>
          String(c.value ? c.value(row) : (row[c.key] ?? ""))
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    );
    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      result.sort((a, b) => {
        const x = column.value ? column.value(a) : a[column.key],
          y = column.value ? column.value(b) : b[column.key];
        return (
          (typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x ?? "").localeCompare(String(y ?? ""), undefined, {
                numeric: true,
              })) * sort.direction
        );
      });
    }
    return result;
  }, [rows, columns, query, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    current = Math.min(page, pages - 1);
  return (
    <section className="data-table">
      <div className="table-toolbar">
        {searchable && (
          <label>
            {searchLabel}
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              aria-label={`${searchLabel} ${caption || "records"}`}
            />
          </label>
        )}
        <span className="muted">
          {loading ? "Loading…" : `${filtered.length} records`}
        </span>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <div
        className="tablewrap"
        tabIndex={0}
        role="region"
        aria-label={caption || "Records"}
      >
        <table className="table">
          <caption>{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={c.money ? "money-cell" : ""}
                  aria-sort={
                    sort?.key === c.key
                      ? sort.direction === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {c.sortable === false ? (
                    c.label
                  ) : (
                    <button
                      className="sort-button"
                      onClick={() => {
                        setSort({
                          key: c.key,
                          direction: sort?.key === c.key ? -sort.direction : 1,
                        });
                        setPage(0);
                      }}
                    >
                      {c.label}
                      {sort?.key === c.key
                        ? sort.direction === 1
                          ? " ↑"
                          : " ↓"
                        : ""}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading || !filtered.length ? (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  {loading
                    ? "Loading records…"
                    : error
                      ? "Records unavailable."
                      : empty}
                </td>
              </tr>
            ) : (
              filtered
                .slice(current * pageSize, (current + 1) * pageSize)
                .map((row, index) => (
                  <tr
                    key={
                      typeof rowKey === "function"
                        ? rowKey(row)
                        : (row[rowKey] ?? index)
                    }
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={c.money ? "money-cell" : ""}>
                        {c.render
                          ? c.render(row)
                          : c.value
                            ? c.value(row)
                            : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <button
          disabled={!current || loading}
          onClick={() => setPage(current - 1)}
        >
          Previous rows
        </button>
        <span>
          Page {current + 1} of {pages}
        </span>
        <button
          disabled={current >= pages - 1 || loading}
          onClick={() => setPage(current + 1)}
        >
          Next rows
        </button>
      </div>
    </section>
  );
}
