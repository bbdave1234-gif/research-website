"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import Link from "next/link";

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1979 + 2 }, (_, i) => CURRENT_YEAR + 1 - i);

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [doi, setDoi] = useState("");
  const [journal, setJournal] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setStatus({ type: "error", text: "Please choose a PDF or Word file." });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setStatus({ type: "error", text: "File is larger than the 100MB limit." });
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isPdf && !isDocx) {
      setStatus({ type: "error", text: "Only .pdf or .docx files are accepted." });
      return;
    }

    setSubmitting(true);
    try {
      await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({
          title,
          year,
          doi,
          journal,
          password,
          fileType: isPdf ? "pdf" : "docx",
        }),
      });

      setStatus({ type: "success", text: "Paper uploaded successfully." });
      setTitle("");
      setDoi("");
      setJournal("");
      setPassword("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setStatus({ type: "error", text: (err as Error).message || "Upload failed." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Upload a Paper</h1>
      <p className="tagline">
        Add a new research paper (PDF or Word, up to 100MB) to the{" "}
        <Link href="/publications">Publications</Link> page.
      </p>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="title">Paper title</label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fiscal Federalism in Rural Governance"
          />
        </div>

        <div className="form-row">
          <label htmlFor="year">Year of publication</label>
          <select id="year" value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="journal">Journal name (optional)</label>
          <input
            id="journal"
            type="text"
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="e.g. Indian Journal of Public Administration"
          />
        </div>

        <div className="form-row">
          <label htmlFor="doi">DOI (optional)</label>
          <input
            id="doi"
            type="text"
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            placeholder="e.g. 10.1234/abcd.5678"
          />
        </div>

        <div className="form-row">
          <label htmlFor="file">File (.pdf or .docx, up to 100MB)</label>
          <input id="file" type="file" accept=".pdf,.docx" ref={fileInputRef} required />
        </div>

        <div className="form-row">
          <label htmlFor="password">Upload password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Uploading…" : "Upload paper"}
        </button>

        {status && (
          <p className={`status-message ${status.type}`}>{status.text}</p>
        )}
      </form>
    </div>
  );
}
