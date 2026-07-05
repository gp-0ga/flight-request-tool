export type Airport = {
  code: string
  name: string
}

export const AIRPORTS: Airport[] = [
  { code: "CTS", name: "新千歳" },
  { code: "HKD", name: "函館" },
  { code: "KUH", name: "釧路" },
  { code: "OBO", name: "帯広" },
  { code: "AKJ", name: "旭川" },
  { code: "WKJ", name: "稚内" },
  { code: "MBE", name: "女満別" },
  { code: "RIS", name: "利尻" },
  { code: "OIR", name: "奥尻" },
  { code: "SHB", name: "中標津" },
]

export function airportLabel(code: string): string {
  const a = AIRPORTS.find((x) => x.code === code)
  return a ? `${a.name}(${a.code})` : code
}
