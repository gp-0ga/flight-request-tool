import { useMemo, useState } from "react"
import { CalendarPlus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AIRPORTS, airportLabel } from "@/data/airports"
import { getFlights, type Flight, type Period } from "@/data/flights"

type TripType = "roundtrip" | "oneway"

type LegState = {
  period: "ALL" | Period
  flightNo: string
}

const emptyLeg: LegState = { period: "ALL", flightNo: "" }

function todayString(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

function formatDateJp(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(`${dateStr}T00:00:00`)
  const days = ["日", "月", "火", "水", "木", "金", "土"]
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`
}

function filterFlights(flights: Flight[], period: "ALL" | Period): Flight[] {
  if (period === "ALL") return flights
  return flights.filter((f) => f.period === period)
}

function flightLabel(flights: Flight[], flightNo: string): string {
  const f = flights.find((x) => x.flightNo === flightNo)
  return f ? `${f.flightNo}(${f.dep}→${f.arr})` : ""
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

// date/timeは日本時間(Asia/Tokyo, UTC+9, DSTなし)として解釈しUTCに変換する。
// VTIMEZONEを持たないUTC("Z")形式にすることで、どのカレンダーアプリでも
// 現地表示のタイムゾーン変換に依存せず正しい時刻になる。
function toIcsUtc(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  const d = new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0))
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}00Z`
}

function nowIcsUtc(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
}

// RFC5545 3.3.11: バックスラッシュ→改行→カンマ→セミコロンの順でエスケープする
// (先にバックスラッシュを処理しないと、後段で追加した"\"自体を二重エスケープしてしまう)
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

// RFC5545 3.1: コンテンツ行は75オクテット(バイト)を超えたら折り返す。
// 日本語はUTF-8で1文字3バイトになるため、マルチバイト文字の途中で
// 分割しないようバイト列を見ながら継続バイト(10xxxxxx)を避けて切る。
function foldIcsLine(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line

  const decoder = new TextDecoder()
  const chunks: string[] = []
  let start = 0
  let limit = 75
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length)
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--
    }
    chunks.push(decoder.decode(bytes.slice(start, end)))
    start = end
    limit = 74 // 継続行は先頭に付与する1オクテットの空白を含めて75にする
  }
  return chunks.join("\r\n ")
}

function generateUid(flightNo: string, date: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${flightNo}-${date.replaceAll("-", "")}-${random}@flight-request-tool`
}

function isIOS(): boolean {
  const ua = navigator.userAgent
  const isAppleTouchDevice = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+はUAがMacと同一になるため、タッチ対応で判別する
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  return isAppleTouchDevice || isIPadOS
}

function isWindows(): boolean {
  return /Windows/.test(navigator.userAgent)
}

// Googleカレンダーのクイック追加は日本時間のローカル時刻文字列+ctzパラメータを使う
// (UTC変換した.ics用のtoIcsUtcとは別物)
function toCalendarDateTime(date: string, time: string): string {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`
}

function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const url = new URL("https://calendar.google.com/calendar/render")
  url.searchParams.set("action", "TEMPLATE")
  url.searchParams.set("text", event.summary)
  url.searchParams.set(
    "dates",
    `${toCalendarDateTime(event.date, event.dep)}/${toCalendarDateTime(event.date, event.arr)}`
  )
  url.searchParams.set("location", event.location)
  url.searchParams.set("ctz", "Asia/Tokyo")
  return url.toString()
}

type CalendarEvent = {
  uid: string
  summary: string
  location: string
  date: string
  dep: string
  arr: string
}

function buildIcs(events: CalendarEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//flight-request-tool//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${nowIcsUtc()}`,
      `DTSTART:${toIcsUtc(event.date, event.dep)}`,
      `DTEND:${toIcsUtc(event.date, event.arr)}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
      `LOCATION:${escapeIcsText(event.location)}`,
      "END:VEVENT"
    )
  }
  lines.push("END:VCALENDAR")
  return lines.map(foldIcsLine).join("\r\n")
}

function LegPicker({
  idPrefix,
  title,
  date,
  origin,
  destination,
  leg,
  onChange,
}: {
  idPrefix: string
  title: string
  date: string
  origin: string
  destination: string
  leg: LegState
  onChange: (next: LegState) => void
}) {
  const allFlights = useMemo(
    () => getFlights(origin, destination),
    [origin, destination]
  )
  const flights = useMemo(
    () => filterFlights(allFlights, leg.period),
    [allFlights, leg.period]
  )
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold lg:text-[1.09375rem]">{title}</p>
        <span className="text-muted-foreground text-xs lg:text-[0.9375rem]">
          {formatDateJp(date)} {airportLabel(origin)} → {airportLabel(destination)}
        </span>
      </div>

      {allFlights.length === 0 ? (
        <p className="text-destructive text-sm lg:text-[1.09375rem]">
          該当便が見つかりません。事務担当に直接お問い合わせください。
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(["ALL", "AM", "PM"] as const).map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                className="lg:text-base"
                variant={leg.period === p ? "default" : "outline"}
                onClick={() => onChange({ ...leg, period: p })}
              >
                {p === "ALL" ? "すべて" : p === "AM" ? "午前" : "午後"}
              </Button>
            ))}
          </div>
          <Select
            value={leg.flightNo}
            onValueChange={(v) => onChange({ ...leg, flightNo: v })}
          >
            <SelectTrigger id={`${idPrefix}-flight`} className="w-full min-w-0 lg:text-[1.09375rem]">
              <SelectValue placeholder="便を選択" />
            </SelectTrigger>
            <SelectContent>
              {flights.map((f) => (
                <SelectItem key={f.flightNo} value={f.flightNo}>
                  {f.flightNo} {f.dep}→{f.arr}
                  <Badge variant="secondary" className="ml-2 lg:text-[0.9375rem]">
                    {f.period === "AM" ? "午前" : "午後"}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [tripType, setTripType] = useState<TripType>("roundtrip")
  const [departureDate, setDepartureDate] = useState(todayString())
  const [returnDate, setReturnDate] = useState(todayString())
  const [origin, setOrigin] = useState("CTS")
  const [destination, setDestination] = useState("KUH")
  const [outbound, setOutbound] = useState<LegState>(emptyLeg)
  const [inbound, setInbound] = useState<LegState>(emptyLeg)
  const [copied, setCopied] = useState(false)
  // nullの間は復路の空港を往路から自動で反転させる(目的地→出発地)。
  // 個別に変更されたら独立した値を持ち、往路を変えても連動しなくなる。
  const [inboundAirports, setInboundAirports] = useState<{
    origin: string
    destination: string
  } | null>(null)

  const inboundOrigin = inboundAirports?.origin ?? destination
  const inboundDestination = inboundAirports?.destination ?? origin

  const outboundFlights = useMemo(
    () => getFlights(origin, destination),
    [origin, destination]
  )
  const inboundFlights = useMemo(
    () => getFlights(inboundOrigin, inboundDestination),
    [inboundOrigin, inboundDestination]
  )

  const message = useMemo(() => {
    const lines: string[] = []
    lines.push("お疲れ様です。")
    lines.push("以下の航空券の予約をお願いします。")
    lines.push("")

    lines.push(`【${tripType === "roundtrip" ? "往路" : "便"}】`)
    lines.push(
      `${formatDateJp(departureDate)} ${airportLabel(origin)} → ${airportLabel(destination)}`
    )
    if (outboundFlights.length === 0) {
      lines.push("該当便が見つかりません。事務担当に直接お問い合わせください。")
    } else if (outbound.flightNo) {
      lines.push(flightLabel(outboundFlights, outbound.flightNo))
    }

    if (tripType === "roundtrip") {
      lines.push("")
      lines.push("【復路】")
      lines.push(
        `${formatDateJp(returnDate)} ${airportLabel(inboundOrigin)} → ${airportLabel(inboundDestination)}`
      )
      if (inboundFlights.length === 0) {
        lines.push("該当便が見つかりません。事務担当に直接お問い合わせください。")
      } else if (inbound.flightNo) {
        lines.push(flightLabel(inboundFlights, inbound.flightNo))
      }
    }

    return lines.join("\n")
  }, [
    tripType,
    departureDate,
    returnDate,
    origin,
    destination,
    inboundOrigin,
    inboundDestination,
    outbound,
    inbound,
    outboundFlights,
    inboundFlights,
  ])

  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = []
    const outboundFlight = outboundFlights.find((f) => f.flightNo === outbound.flightNo)
    if (outboundFlight) {
      events.push({
        uid: generateUid(outboundFlight.flightNo, departureDate),
        summary: `${outboundFlight.flightNo} ${airportLabel(origin)}→${airportLabel(destination)}`,
        location: airportLabel(origin),
        date: departureDate,
        dep: outboundFlight.dep,
        arr: outboundFlight.arr,
      })
    }
    if (tripType === "roundtrip") {
      const inboundFlight = inboundFlights.find((f) => f.flightNo === inbound.flightNo)
      if (inboundFlight) {
        events.push({
          uid: generateUid(inboundFlight.flightNo, returnDate),
          summary: `${inboundFlight.flightNo} ${airportLabel(inboundOrigin)}→${airportLabel(inboundDestination)}`,
          location: airportLabel(inboundOrigin),
          date: returnDate,
          dep: inboundFlight.dep,
          arr: inboundFlight.arr,
        })
      }
    }
    return events
  }, [
    tripType,
    departureDate,
    returnDate,
    origin,
    destination,
    inboundOrigin,
    inboundDestination,
    outbound,
    inbound,
    outboundFlights,
    inboundFlights,
  ])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleAddToCalendar = () => {
    if (calendarEvents.length === 0) return

    // Windows PCでは.icsをダウンロードしてもファイル関連付けがなく
    // ダブルクリックしても何も起きない上に、開けたとしてもGoogle
    // カレンダーではなくOS既定のカレンダーアプリに渡るだけなので、
    // Googleカレンダーのクイック追加をイベントごとに新規タブで開く。
    if (isWindows()) {
      calendarEvents.forEach((event) => {
        window.open(buildGoogleCalendarUrl(event), "_blank", "noopener,noreferrer")
      })
      return
    }

    const ics = buildIcs(calendarEvents)

    // iOSはBlob+download属性だと「ファイルに保存」に落ちてしまい
    // カレンダー追加画面が出ない。download属性を付けずBlob URLへ
    // location.href遷移するとカレンダー追加プレビューが開くため、
    // iOSだけこの経路にする(data: URLは確定操作が失敗する端末があった)。
    if (isIOS()) {
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8;method=PUBLISH" })
      const url = URL.createObjectURL(blob)
      window.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      return
    }

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "flight-schedule.ics"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const swapAirports = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const actionButtons = (
    <>
      <Button className="flex-1 lg:text-[1.09375rem]" onClick={handleCopy}>
        {copied ? "コピーしました" : "メッセージをコピー"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="lg:text-[1.09375rem]"
        onClick={handleAddToCalendar}
        disabled={calendarEvents.length === 0}
      >
        <CalendarPlus />
        カレンダーに登録
      </Button>
    </>
  )

  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto max-w-md space-y-3 p-3 pb-20 lg:max-w-[70rem] lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-4 lg:space-y-0 lg:pb-3">
        <header className="text-center lg:col-span-2">
          <h1 className="text-base font-bold lg:text-xl">航空券予約依頼メッセージ作成</h1>
        </header>

        <Card className="gap-3 py-3">
          <CardContent className="space-y-3 px-3">
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1 lg:text-base"
                size="sm"
                variant={tripType === "roundtrip" ? "default" : "outline"}
                onClick={() => setTripType("roundtrip")}
              >
                往復
              </Button>
              <Button
                type="button"
                className="flex-1 lg:text-base"
                size="sm"
                variant={tripType === "oneway" ? "default" : "outline"}
                onClick={() => setTripType("oneway")}
              >
                片道
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="dep-date" className="text-xs lg:text-[0.9375rem]">
                  出発日
                </Label>
                <input
                  id="dep-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="border-input bg-transparent box-border flex h-8 w-full min-w-0 rounded-md border px-2 py-1 text-sm shadow-xs lg:text-[1.09375rem]"
                />
              </div>
              {tripType === "roundtrip" && (
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="ret-date" className="text-xs lg:text-[0.9375rem]">
                    帰着日
                  </Label>
                  <input
                    id="ret-date"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="border-input bg-transparent box-border flex h-8 w-full min-w-0 rounded-md border px-2 py-1 text-sm shadow-xs lg:text-[1.09375rem]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs lg:text-[0.9375rem]" htmlFor="origin-select">
                  出発地
                </Label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger
                    id="origin-select"
                    className="w-full min-w-0 lg:text-[1.09375rem]"
                    size="sm"
                  >
                    <SelectValue className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {AIRPORTS.map((a) => (
                      <SelectItem key={a.code} value={a.code}>
                        {a.name}({a.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 lg:text-base"
                onClick={swapAirports}
                aria-label="出発地と目的地を入れ替え"
              >
                ⇄
              </Button>
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs lg:text-[0.9375rem]" htmlFor="destination-select">
                  目的地
                </Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger
                    id="destination-select"
                    className="w-full min-w-0 lg:text-[1.09375rem]"
                    size="sm"
                  >
                    <SelectValue className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {AIRPORTS.map((a) => (
                      <SelectItem key={a.code} value={a.code}>
                        {a.name}({a.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 border-t pt-3">
              <LegPicker
                idPrefix="outbound"
                title="往路"
                date={departureDate}
                origin={origin}
                destination={destination}
                leg={outbound}
                onChange={setOutbound}
              />
              {tripType === "roundtrip" && (
                <>
                  {inboundAirports ? (
                    <div className="space-y-2 rounded-md border p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-xs lg:text-[0.9375rem]">
                          復路の空港
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => setInboundAirports(null)}
                          aria-label="復路の個別設定を閉じる"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                          <Label className="text-xs lg:text-[0.9375rem]" htmlFor="inbound-origin-select">
                            出発地
                          </Label>
                          <Select
                            value={inboundAirports.origin}
                            onValueChange={(v) =>
                              setInboundAirports({ ...inboundAirports, origin: v })
                            }
                          >
                            <SelectTrigger
                              id="inbound-origin-select"
                              className="w-full min-w-0 lg:text-[1.09375rem]"
                              size="sm"
                            >
                              <SelectValue className="truncate" />
                            </SelectTrigger>
                            <SelectContent>
                              {AIRPORTS.map((a) => (
                                <SelectItem key={a.code} value={a.code}>
                                  {a.name}({a.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8 lg:text-base"
                          onClick={() =>
                            setInboundAirports({
                              origin: inboundAirports.destination,
                              destination: inboundAirports.origin,
                            })
                          }
                          aria-label="復路の出発地と目的地を入れ替え"
                        >
                          ⇄
                        </Button>
                        <div className="min-w-0 flex-1 space-y-1">
                          <Label className="text-xs lg:text-[0.9375rem]" htmlFor="inbound-destination-select">
                            目的地
                          </Label>
                          <Select
                            value={inboundAirports.destination}
                            onValueChange={(v) =>
                              setInboundAirports({ ...inboundAirports, destination: v })
                            }
                          >
                            <SelectTrigger
                              id="inbound-destination-select"
                              className="w-full min-w-0 lg:text-[1.09375rem]"
                              size="sm"
                            >
                              <SelectValue className="truncate" />
                            </SelectTrigger>
                            <SelectContent>
                              {AIRPORTS.map((a) => (
                                <SelectItem key={a.code} value={a.code}>
                                  {a.name}({a.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="lg:text-[0.9375rem]"
                      onClick={() =>
                        setInboundAirports({ origin: destination, destination: origin })
                      }
                    >
                      復路の空港を個別に変更
                    </Button>
                  )}
                  <LegPicker
                    idPrefix="inbound"
                    title="復路"
                    date={returnDate}
                    origin={inboundOrigin}
                    destination={inboundDestination}
                    leg={inbound}
                    onChange={setInbound}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-2 py-3 lg:flex lg:h-full lg:flex-col">
          <CardHeader className="px-3">
            <CardTitle className="text-sm lg:text-[1.09375rem]">メッセージプレビュー</CardTitle>
          </CardHeader>
          <CardContent className="px-3 lg:flex lg:flex-1 lg:flex-col">
            <pre className="bg-muted whitespace-pre-wrap rounded-md p-2 text-sm lg:flex-1 lg:text-[1.09375rem]">
              {message}
            </pre>
            <div className="mt-3 hidden gap-2 lg:flex">{actionButtons}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-background/95 fixed inset-x-0 bottom-0 border-t p-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md gap-2">{actionButtons}</div>
      </div>
    </div>
  )
}
