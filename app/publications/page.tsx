"use client";

import { useEffect, useMemo, useState } from "react";
import type { Paper } from "@/lib/blob-store";

export default function PublicationsPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/papers", { cache: "no-store" });
        if (!res.ok) throw new Error("Could not load papers.");
        const data = await res.json();
        if (!cancelled) setPapers(data.papers);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const years = useMemo(() => {
    const set = new Set(papers.map((p) => p.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [papers]);

  const filtered = useMemo(() => {
    if (yearFilter === "all") return papers;
    return papers.filter((p) => String(p.year) === yearFilter);
  }, [papers, yearFilter]);

  return (
    <div>
      <h1>Publications</h1>

      <div className="counter-banner">
        <span className="count">{papers.length}</span>
        <span className="label">
          {papers.length === 1 ? "paper" : "papers"} published on this site
        </span>
      </div>

      {years.length > 0 && (
        <div className="filter-row">
          <label htmlFor="year-filter">Filter by year:</label>
          <select
            id="year-filter"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && <p className="empty-state">Loading publications…</p>}
      {error && <p className="status-message error">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="empty-state">
          No papers uploaded yet. Use the Upload page to add the first one.
        </p>
      )}

      {filtered.map((paper) => (
        <div className="paper-card" key={paper.id}>
          <div>
            <h3 className="title">{paper.title}</h3>
            <div className="meta">
              {paper.year} · {paper.fileType === "docx" ? "Word document" : "PDF"}
              {paper.journal && <> · {paper.journal}</>}
              {paper.doi && (
                <>
                  {" "}
                  ·{" "}
                  
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    DOI: {paper.doi}
                  </a>
                </>
              )}
            </div>
          </div>
          <a className="btn" href={paper.url} target="_blank" rel="noreferrer">
            View / Download
          </a>
        </div>
      ))}
    </div>
  );
}

  
     
