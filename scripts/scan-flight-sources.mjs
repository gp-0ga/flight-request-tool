import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const snapshotPath = resolve(root, "data/flight-source-status.json")
const sources = [
  {
    id: "ana-hokkaido-timetable",
    label: "ANA 北海道内路線時刻表",
    url: "https://www.ana.co.jp/guide/plan/airinfo/dom-timetable/pdf/timetable_hokkaido_20260701_20261024.pdf",
  },
  {
    id: "jal-domestic-operation",
    label: "JAL 国内線 運航路線・時刻表",
    url: "https://www.jal.co.jp/jp/ja/dom/route/plan/operation.html",
  },
  {
    id: "hac-route-time",
    label: "HAC 時刻表・発着案内",
    url: "https://www.info.hac-air.co.jp/route_time/",
  },
]

async function loadPrevious() {
  const text = await readFile(snapshotPath, "utf8").catch(() => "")
  if (!text) return { sources: {} }
  return JSON.parse(text.replace(/^\uFEFF/, ""))
}

async function probe(source) {
  const response = await fetch(source.url, {
    method: "HEAD",
    headers: { "user-agent": "flight-request-tool schedule monitor" },
  })
  return {
    id: source.id,
    label: source.label,
    url: source.url,
    status: response.status,
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
    contentLength: response.headers.get("content-length"),
    checkedAt: new Date().toISOString(),
  }
}

const previous = await loadPrevious()
const currentEntries = await Promise.all(sources.map(probe))
const current = Object.fromEntries(currentEntries.map((entry) => [entry.id, entry]))
const changes = []
const hasPreviousSnapshot = Object.keys(previous.sources ?? {}).length > 0

for (const entry of currentEntries) {
  const old = previous.sources?.[entry.id]
  if (!old) {
    changes.push(`${entry.label}: 初回記録`)
    continue
  }
  for (const key of ["status", "etag", "lastModified"]) {
    if ((old[key] ?? null) !== (entry[key] ?? null)) {
      changes.push(`${entry.label}: ${key} が変わりました (${old[key] ?? "-"} -> ${entry[key] ?? "-"})`)
    }
  }
}

if (changes.length || !hasPreviousSnapshot) {
  await mkdir(dirname(snapshotPath), { recursive: true })
  await writeFile(
    snapshotPath,
    `${JSON.stringify({ scannedAt: new Date().toISOString(), sources: current }, null, 2)}\n`,
    "utf8",
  )
}

if (changes.length) {
  console.error(`航空便ソースに確認が必要な変化があります:\n- ${changes.join("\n- ")}`)
  process.exitCode = 1
} else {
  console.log("航空便ソースのヘッダーに変化はありません")
}
