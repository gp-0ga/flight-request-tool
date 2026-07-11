export type Airport = {
  code: string
  name: string
}

// 北海道内14空港のうち、礼文空港(RBJ)は滑走路整備問題により
// 定期便が休止中のため対象外。定期便就航中の12空港を掲載。
export const AIRPORTS: Airport[] = [
  { code: "CTS", name: "新千歳" },
  { code: "OKD", name: "丘珠" },
  { code: "KUH", name: "釧路" },
  { code: "MMB", name: "女満別" },
  { code: "HKD", name: "函館" },
  { code: "OBO", name: "帯広" },
  { code: "AKJ", name: "旭川" },
  { code: "WKJ", name: "稚内" },
  { code: "MBE", name: "紋別" },
  { code: "RIS", name: "利尻" },
  { code: "OIR", name: "奥尻" },
  { code: "SHB", name: "中標津" },
]

export function airportLabel(code: string): string {
  const a = AIRPORTS.find((x) => x.code === code)
  return a ? `${a.name}(${a.code})` : code
}
