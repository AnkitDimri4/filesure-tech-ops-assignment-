import { useEffect, useState, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function App() {
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState([]);

  const totalPages = Math.ceil(total / limit) || 1;

  const fetchCompanies = useCallback(
    async (pageToLoad = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("page", pageToLoad);
        params.append("limit", limit);
        if (status) params.append("status", status);
        if (stateFilter) params.append("state", stateFilter);

        const res = await fetch(`${API_BASE}/companies?` + params.toString());
        const json = await res.json();
        setCompanies(json.data || []);
        setTotal(json.total || 0);
        setPage(json.page || pageToLoad);
      } catch (err) {
        console.error("Error fetching companies:", err);
      } finally {
        setLoading(false);
      }
    },
    [status, stateFilter, limit]
  );

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/companies/summary`);
      const json = await res.json();
      setSummary(json.summary || []);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  }, []);

  useEffect(() => {
    fetchCompanies(1);
    fetchSummary();
  }, [fetchCompanies, fetchSummary]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchCompanies(1);
  };

  const handlePrev = () => {
    if (page > 1) fetchCompanies(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) fetchCompanies(page + 1);
  };

  return (
    <Motion.div
      className="app-root light"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <header className="app-header">
        <div className="app-title-block">
          <h1 className="app-title">FileSure Company Explorer</h1>
          <p className="app-subtitle">
            Explore cleaned company data from MongoDB with simple filters.
          </p>
        </div>
      </header>

      <main className="app-main">
        <Motion.section
          className="filters-card"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={handleFilterSubmit} className="filters-form">
            <div className="filters-row">
              <div className="field-group">
                <label className="field-label">Status</label>
                <input
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Active, Strike Off, Under Liquidation"
                  className="input-field"
                />
              </div>
              <div className="field-group">
                <label className="field-label">State</label>
                <input
                  type="text"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  placeholder="Maharashtra, Karnataka, Gujarat..."
                  className="input-field"
                />
              </div>
              <div className="field-group field-actions">
                <button type="submit" className="btn primary-btn">
                  Apply
                </button>
                <button
                  type="button"
                  className="btn ghost-btn"
                  onClick={() => {
                    setStatus("");
                    setStateFilter("");
                    fetchCompanies(1);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

          <div className="summary-chip-row">
            <AnimatePresence>
              {summary.map((s) => (
                <Motion.div
                  key={s.status}
                  className="summary-chip"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="summary-chip-label">
                    {s.status || "Unknown"}
                  </span>
                  <span className="summary-chip-count">{s.count}</span>
                </Motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Motion.section>

        <Motion.section
          className="table-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="table-header-row">
            <h2 className="table-title">Company records</h2>
            <p className="table-meta">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ·{" "}
              <strong>{total}</strong> total records
            </p>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <div className="loader-row">
                <div className="spinner" />
                <span>Loading companies…</span>
              </div>
            ) : (
              <table className="companies-table">
                <thead>
                  <tr>
                    <th>CIN</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>State</th>
                    <th>Incorporation</th>
                    <th>Director 1</th>
                    <th>Director 2</th>
                    <th>Paid Up Capital</th>
                    <th>Last Filing</th>
                    <th>Email</th>
                    <th>Valid Email</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {companies.map((c) => (
                      <Motion.tr
                        key={c._id}
                        className="row-fade-in"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td>{c.cin || "—"}</td>
                        <td>{c.company_name || "—"}</td>
                        <td>{c.status || "—"}</td>
                        <td>{c.state || "—"}</td>
                        <td>{c.incorporation_date || "—"}</td>
                        <td>{c.director_1 || "—"}</td>
                        <td>{c.director_2 || "—"}</td>
                        <td>
                          {typeof c.paid_up_capital === "number"
                            ? c.paid_up_capital.toLocaleString("en-IN")
                            : "—"}
                        </td>
                        <td>{c.last_filing_date || "—"}</td>
                        <td>{c.email || "—"}</td>
                        <td>
                          <span
                            className={
                              c.is_valid_email
                                ? "badge badge-success"
                                : "badge badge-danger"
                            }
                          >
                            {c.is_valid_email ? "Valid" : "Invalid"}
                          </span>
                        </td>
                      </Motion.tr>
                    ))}
                    {!companies.length && !loading && (
                      <tr>
                        <td colSpan={11} className="empty-row">
                          No companies found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          <div className="pagination-row">
            <button
              className="btn ghost-btn"
              onClick={handlePrev}
              disabled={page <= 1}
            >
              ← Previous
            </button>
            <div className="page-indicator">
              Page <span>{page}</span> of <span>{totalPages}</span>
            </div>
            <button
              className="btn ghost-btn"
              onClick={handleNext}
              disabled={page >= totalPages}
            >
              Next →
            </button>
          </div>
        </Motion.section>
      </main>

      <footer className="app-footer">
        <span>Built by Ankit Dimri · FileSure Tech Ops & Support assignment</span>
      </footer>
    </Motion.div>
  );
}

export default App;