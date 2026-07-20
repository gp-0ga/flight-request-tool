import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const flightsPath = resolve(root, "src/data/flights.ts")
const source = await readFile(flightsPath, "utf8")

function readConst(name) {
  const match = source.match(new RegExp(`export const ${name} = "([^"]+)"`))
  if (!match) throw new Error(`${name} が見つかりません`)
  return match[1]
}

function readFlights() {
  const start = source.indexOf("export const FLIGHTS")
  if (start === -1) throw new Error("FLIGHTS が見つかりません")
  const equals = source.indexOf("=", start)
  const end = source.indexOf("function timeToMinutes", equals)
  if (equals === -1 || end === -1) throw new Error("FLIGHTS の範囲を特定できません")
  const objectSource = source.slice(equals + 1, end).trim()
  return Function(`"use strict"; return (${objectSource});`)()
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

const validFrom = readConst("SCHEDULE_VALID_FROM")
const validTo = readConst("SCHEDULE_VALID_TO")
const lastVerified = readConst("SCHEDULE_LAST_VERIFIED")
const dataVersion = readConst("SCHEDULE_DATA_VERSION")
const flights = readFlights()
const errors = []

for (const [label, value] of [
  ["SCHEDULE_VALID_FROM", validFrom],
  ["SCHEDULE_VALID_TO", validTo],
  ["SCHEDULE_LAST_VERIFIED", lastVerified],
  ["SCHEDULE_DATA_VERSION", dataVersion],
]) {
  if (!isDate(value)) errors.push(`${label} は YYYY-MM-DD にしてください: ${value}`)
}
if (validFrom > validTo) errors.push("SCHEDULE_VALID_FROM が SCHEDULE_VALID_TO より後です")
if (lastVerified < validFrom || lastVerified > validTo) {
  errors.push("SCHEDULE_LAST_VERIFIED は対応ダイヤ期間内の日付にしてください")
}

const routes = Object.entries(flights)
if (routes.length === 0) errors.push("FLIGHTS が空です")
for (const [route, routeFlights] of routes) {
  if (!/^[A-Z]{3}-[A-Z]{3}$/.test(route)) errors.push(`${route}: ルートキーは XXX-YYY 形式にしてください`)
  if (!Array.isArray(routeFlights) || routeFlights.length === 0) {
    errors.push(`${route}: 便がありません`)
    continue
  }
  const seen = new Set()
  for (const flight of routeFlights) {
    const label = `${route}/${flight.flightNo ?? "(便名なし)"}`
    if (!/^[A-Z0-9]{2}\d{3,4}$/.test(flight.flightNo ?? "")) errors.push(`${label}: 便名形式が不正です`)
    if (seen.has(flight.flightNo)) errors.push(`${route}: ${flight.flightNo} が重複しています`)
    seen.add(flight.flightNo)
    if (!isTime(flight.dep)) errors.push(`${label}: 出発時刻が HH:mm ではありません`)
    if (!isTime(flight.arr)) errors.push(`${label}: 到着時刻が HH:mm ではありません`)
    if (!["AM", "PM"].includes(flight.period)) errors.push(`${label}: period は AM/PM にしてください`)
    if (flight.operatingWeekdays?.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
      errors.push(`${label}: operatingWeekdays は 0〜6 の配列にしてください`)
    }
    if (flight.operatingMonths?.some((month) => !Number.isInteger(month) || month < 1 || month > 12)) {
      errors.push(`${label}: operatingMonths は 1〜12 の配列にしてください`)
    }
    if (flight.nonOperatingDates?.some((date) => !isDate(date))) {
      errors.push(`${label}: nonOperatingDates は YYYY-MM-DD の配列にしてください`)
    }
  }
}

if (errors.length) {
  throw new Error(`航空便データの検証に失敗しました:\n- ${errors.join("\n- ")}`)
}

const count = routes.reduce((sum, [, routeFlights]) => sum + routeFlights.length, 0)
console.log(`航空便データOK: ${routes.length}区間 / ${count}便 / 確認日 ${lastVerified}`)
