import { list, put } from "@vercel/blob";

export type Paper = {
  id: string;
  title: string;
  year: number;
  url: string;
  filename: string;
  fileType: string;
  uploadedAt: string;
  doi?: string;
  journal?: string;
};

// A single JSON file in the Blob store acts as our lightweight database.
// It's fine for a personal publications list; if this ever needs to
// support concurrent multi-user writes, swap this for Vercel Postgres/KV.
const METADATA_PATH = "metadata/papers.json";

export async function getPapers(): Promise<Paper[]> {
  const { blobs } = await list({ prefix: METADATA_PATH });
  const metaBlob = blobs.find((b) => b.pathname === METADATA_PATH);
  if (!metaBlob) return [];

  const res = await fetch(metaBlob.url, { cache: "no-store" });
  if (!res.ok) return [];

  const data = (await res.json()) as Paper[];
  return data.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

export async function addPaper(paper: Paper): Promise<Paper[]> {
  const papers = await getPapers();
  papers.push(paper);

  await put(METADATA_PATH, JSON.stringify(papers, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  return papers;
}
