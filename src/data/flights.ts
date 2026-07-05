export type Period = "AM" | "PM"

export type Flight = {
  flightNo: string
  dep: string
  arr: string
  period: Period
}

// モックデータ: 就航ダイヤの雛形（空席・欠航は考慮しない）
// キーは "出発地コード-到着地コード"
export const FLIGHTS: Record<string, Flight[]> = {
  "CTS-HKD": [
    { flightNo: "JAL566", dep: "07:35", arr: "08:20", period: "AM" },
    { flightNo: "ANA1897", dep: "10:15", arr: "11:00", period: "AM" },
    { flightNo: "JAL570", dep: "14:40", arr: "15:25", period: "PM" },
    { flightNo: "ANA1893", dep: "18:05", arr: "18:50", period: "PM" },
  ],
  "HKD-CTS": [
    { flightNo: "JAL561", dep: "08:55", arr: "09:40", period: "AM" },
    { flightNo: "ANA1890", dep: "11:35", arr: "12:20", period: "AM" },
    { flightNo: "JAL565", dep: "16:00", arr: "16:45", period: "PM" },
    { flightNo: "ANA1896", dep: "19:20", arr: "20:05", period: "PM" },
  ],
  "CTS-KUH": [
    { flightNo: "ANA771", dep: "08:10", arr: "09:00", period: "AM" },
    { flightNo: "JAL2951", dep: "11:50", arr: "12:40", period: "AM" },
    { flightNo: "ANA775", dep: "17:15", arr: "18:05", period: "PM" },
  ],
  "KUH-CTS": [
    { flightNo: "ANA770", dep: "09:40", arr: "10:30", period: "AM" },
    { flightNo: "JAL2950", dep: "13:20", arr: "14:10", period: "PM" },
    { flightNo: "ANA774", dep: "18:45", arr: "19:35", period: "PM" },
  ],
  "CTS-OBO": [
    { flightNo: "ANA761", dep: "07:50", arr: "08:35", period: "AM" },
    { flightNo: "JAL2921", dep: "12:30", arr: "13:15", period: "AM" },
    { flightNo: "ANA765", dep: "19:00", arr: "19:45", period: "PM" },
  ],
  "OBO-CTS": [
    { flightNo: "ANA760", dep: "09:05", arr: "09:50", period: "AM" },
    { flightNo: "JAL2920", dep: "14:00", arr: "14:45", period: "PM" },
    { flightNo: "ANA764", dep: "20:15", arr: "21:00", period: "PM" },
  ],
  "CTS-AKJ": [
    { flightNo: "ANA641", dep: "08:30", arr: "09:15", period: "AM" },
    { flightNo: "JAL471", dep: "13:05", arr: "13:50", period: "PM" },
    { flightNo: "ANA645", dep: "17:50", arr: "18:35", period: "PM" },
  ],
  "AKJ-CTS": [
    { flightNo: "ANA640", dep: "10:00", arr: "10:45", period: "AM" },
    { flightNo: "JAL470", dep: "15:10", arr: "15:55", period: "PM" },
    { flightNo: "ANA644", dep: "19:10", arr: "19:55", period: "PM" },
  ],
  "CTS-WKJ": [
    { flightNo: "ANA741", dep: "09:20", arr: "10:15", period: "AM" },
    { flightNo: "ANA745", dep: "16:35", arr: "17:30", period: "PM" },
  ],
  "WKJ-CTS": [
    { flightNo: "ANA740", dep: "11:00", arr: "11:55", period: "AM" },
    { flightNo: "ANA744", dep: "18:15", arr: "19:10", period: "PM" },
  ],
  "CTS-MBE": [
    { flightNo: "ANA781", dep: "08:00", arr: "08:55", period: "AM" },
    { flightNo: "ANA785", dep: "17:40", arr: "18:35", period: "PM" },
  ],
  "MBE-CTS": [
    { flightNo: "ANA780", dep: "09:30", arr: "10:25", period: "AM" },
    { flightNo: "ANA784", dep: "19:05", arr: "20:00", period: "PM" },
  ],
  "CTS-RIS": [
    { flightNo: "HAC802", dep: "08:45", arr: "09:30", period: "AM" },
  ],
  "RIS-CTS": [
    { flightNo: "HAC801", dep: "10:05", arr: "10:50", period: "AM" },
  ],
  "CTS-OIR": [
    { flightNo: "HAC862", dep: "09:10", arr: "09:50", period: "AM" },
  ],
  "OIR-CTS": [
    { flightNo: "HAC861", dep: "10:20", arr: "11:00", period: "AM" },
  ],
  "CTS-SHB": [
    { flightNo: "ANA791", dep: "10:40", arr: "11:35", period: "AM" },
    { flightNo: "ANA795", dep: "18:50", arr: "19:45", period: "PM" },
  ],
  "SHB-CTS": [
    { flightNo: "ANA790", dep: "12:10", arr: "13:05", period: "PM" },
    { flightNo: "ANA794", dep: "20:10", arr: "21:05", period: "PM" },
  ],
}

export function getFlights(origin: string, destination: string): Flight[] {
  return FLIGHTS[`${origin}-${destination}`] ?? []
}
