export type Period = "AM" | "PM"

export type Flight = {
  flightNo: string
  dep: string
  arr: string
  period: Period
}

// 実データに基づく時刻表（2026年7月時点で調査・確認）
// キーは "出発地コード-到着地コード"
//
// 出典:
// - 新千歳(CTS)発着: ANA国内線時刻表 北海道 2026/07/01〜10/24
//   https://www.ana.co.jp/guide/plan/airinfo/dom-timetable/pdf/timetable_hokkaido_20260701_20261024.pdf
//   （便名はNH、運航社はAKX=ANAウイングス。この期間中は日次変動なし）
// - 丘珠(OKD)発着: JAL便名・HAC受託運航。トラベリスト(本日の発着実績)および
//   HAC/JAL関連の検索結果から便名・時刻を確認。中標津・奥尻は季節運航に注意。
//
// 就航ダイヤは季節（夏ダイヤ/冬ダイヤ）ごとに変更されるため、シーズンごとの
// 更新が必須。特に丘珠発着分は正式な全便時刻表としての裏付けが取れていない
// 便を含むため、定期的な実データ確認を推奨。
export const FLIGHTS: Record<string, Flight[]> = {
  "CTS-HKD": [
    { flightNo: "NH4853", dep: "10:55", arr: "11:35", period: "AM" },
    { flightNo: "NH4857", dep: "17:55", arr: "18:35", period: "PM" },
  ],
  "HKD-CTS": [
    { flightNo: "NH4854", dep: "12:05", arr: "12:45", period: "AM" },
    { flightNo: "NH4858", dep: "19:05", arr: "19:45", period: "PM" },
  ],
  "OKD-HKD": [
    { flightNo: "JL2751", dep: "14:40", arr: "15:10", period: "PM" },
    { flightNo: "JL2755", dep: "17:50", arr: "18:20", period: "PM" },
    { flightNo: "JL2759", dep: "19:10", arr: "19:40", period: "PM" },
  ],
  "HKD-OKD": [{ flightNo: "JL2750", dep: "14:00", arr: "14:40", period: "PM" }],

  "CTS-KUH": [
    { flightNo: "NH4871", dep: "07:40", arr: "08:25", period: "AM" },
    { flightNo: "NH4873", dep: "13:20", arr: "14:05", period: "PM" },
    { flightNo: "NH4875", dep: "15:55", arr: "16:40", period: "PM" },
  ],
  "KUH-CTS": [
    { flightNo: "NH4872", dep: "08:55", arr: "09:40", period: "AM" },
    { flightNo: "NH4874", dep: "14:35", arr: "15:20", period: "PM" },
    { flightNo: "NH4876", dep: "17:10", arr: "17:55", period: "PM" },
  ],
  // 丘珠-釧路は毎日3便＋月〜木のみ運航の1便(JL2763/JL2764)の計4便。
  // JL2763/JL2764は金・土・日・祝は運休(2026年7月に駅探で全曜日確認)。
  // このツールは曜日での出し分けをしないため、便リストには載せるが
  // 搭乗日によっては予約できない点に注意。
  "OKD-KUH": [
    { flightNo: "JL2761", dep: "08:00", arr: "08:45", period: "AM" },
    { flightNo: "JL2763", dep: "11:40", arr: "12:25", period: "AM" },
    { flightNo: "JL2765", dep: "14:10", arr: "14:55", period: "PM" },
    { flightNo: "JL2767", dep: "16:45", arr: "17:30", period: "PM" },
  ],
  "KUH-OKD": [
    { flightNo: "JL2762", dep: "09:15", arr: "10:05", period: "AM" },
    { flightNo: "JL2764", dep: "12:55", arr: "13:45", period: "PM" },
    { flightNo: "JL2766", dep: "15:25", arr: "16:15", period: "PM" },
    { flightNo: "JL2768", dep: "18:00", arr: "18:50", period: "PM" },
  ],

  "CTS-WKJ": [
    { flightNo: "NH4841", dep: "10:15", arr: "11:10", period: "AM" },
    { flightNo: "NH4843", dep: "15:30", arr: "16:25", period: "PM" },
  ],
  "WKJ-CTS": [
    { flightNo: "NH4842", dep: "11:45", arr: "12:40", period: "AM" },
    { flightNo: "NH4844", dep: "17:00", arr: "17:55", period: "PM" },
  ],

  "CTS-MMB": [
    { flightNo: "JL2713", dep: "07:40", arr: "08:25", period: "AM" },
    { flightNo: "NH4861", dep: "09:30", arr: "10:15", period: "AM" },
    { flightNo: "JL2715", dep: "12:30", arr: "13:15", period: "PM" },
    { flightNo: "NH4865", dep: "13:20", arr: "14:05", period: "PM" },
    { flightNo: "JL2719", dep: "16:10", arr: "16:50", period: "PM" },
    { flightNo: "NH4867", dep: "18:40", arr: "19:30", period: "PM" },
  ],
  "MMB-CTS": [
    { flightNo: "JL2710", dep: "08:55", arr: "09:40", period: "AM" },
    { flightNo: "NH4862", dep: "10:50", arr: "11:40", period: "AM" },
    { flightNo: "JL2714", dep: "13:55", arr: "14:40", period: "PM" },
    { flightNo: "NH4866", dep: "14:35", arr: "15:25", period: "PM" },
    { flightNo: "JL2718", dep: "17:25", arr: "18:10", period: "PM" },
    { flightNo: "NH4868", dep: "20:00", arr: "20:50", period: "PM" },
  ],
  "OKD-MMB": [
    { flightNo: "JL2721", dep: "09:00", arr: "09:40", period: "AM" },
    { flightNo: "JL2727", dep: "17:55", arr: "18:35", period: "PM" },
  ],
  "MMB-OKD": [
    { flightNo: "JL2722", dep: "10:10", arr: "10:45", period: "AM" },
    { flightNo: "JL2728", dep: "19:00", arr: "19:35", period: "PM" },
  ],

  // 新千歳-利尻は夏季(7〜9月)のみの季節運航。丘珠-利尻は年間通期。
  "CTS-RIS": [{ flightNo: "NH4929", dep: "12:30", arr: "13:25", period: "PM" }],
  "RIS-CTS": [{ flightNo: "NH4930", dep: "14:05", arr: "14:55", period: "PM" }],
  "OKD-RIS": [{ flightNo: "JL2783", dep: "07:55", arr: "08:30", period: "AM" }],
  "RIS-OKD": [{ flightNo: "JL2788", dep: "16:25", arr: "17:05", period: "PM" }],

  "OKD-SHB": [
    { flightNo: "JL2733", dep: "09:55", arr: "10:45", period: "AM" },
    { flightNo: "JL2739", dep: "15:20", arr: "16:10", period: "PM" },
  ],
  "SHB-OKD": [
    { flightNo: "JL2732", dep: "11:15", arr: "12:10", period: "AM" },
    { flightNo: "JL2738", dep: "16:25", arr: "17:05", period: "PM" },
  ],

  // 奥尻線は季節運航・低頻度（金・日のみ）。丘珠線と函館線の2ルートがある。
  "OKD-OIR": [{ flightNo: "JL2795", dep: "11:25", arr: "12:15", period: "AM" }],
  "OIR-OKD": [{ flightNo: "JL2796", dep: "12:45", arr: "13:35", period: "PM" }],
  "HKD-OIR": [{ flightNo: "JL2791", dep: "11:45", arr: "12:15", period: "AM" }],
  "OIR-HKD": [{ flightNo: "JL2792", dep: "12:45", arr: "13:15", period: "PM" }],
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function getFlights(origin: string, destination: string): Flight[] {
  const flights = FLIGHTS[`${origin}-${destination}`] ?? []
  return [...flights].sort((a, b) => timeToMinutes(a.dep) - timeToMinutes(b.dep))
}
