import { useMemo, useState } from "react"
import { CalendarPlus } from "lucide-react"
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

function toCalendarDateTime(date: string, time: string): string {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`
}

function buildGoogleCalendarUrl(params: {
  title: string
  date: string
  dep: string
  arr: string
  details: string
  location: string
}): string {
  const url = new URL("https://calendar.google.com/calendar/render")
  url.searchParams.set("action", "TEMPLATE")
  url.searchParams.set("text", params.title)
  url.searchParams.set(
    "dates",
    `${toCalendarDateTime(params.date, params.dep)}/${toCalendarDateTime(params.date, params.arr)}`
  )
  url.searchParams.set("details", params.details)
  url.searchParams.set("location", params.location)
  url.searchParams.set("ctz", "Asia/Tokyo")
  return url.toString()
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
  const selectedFlight = allFlights.find((f) => f.flightNo === leg.flightNo)

  const calendarUrl = selectedFlight
    ? buildGoogleCalendarUrl({
        title: `出張(${title}) ${airportLabel(origin)}→${airportLabel(destination)}`,
        date,
        dep: selectedFlight.dep,
        arr: selectedFlight.arr,
        details: `便名: ${selectedFlight.flightNo}\n${airportLabel(origin)} → ${airportLabel(destination)}`,
        location: airportLabel(origin),
      })
    : null

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <span className="text-muted-foreground text-xs">
          {formatDateJp(date)} {airportLabel(origin)} → {airportLabel(destination)}
        </span>
      </div>

      {allFlights.length === 0 ? (
        <p className="text-destructive text-sm">
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
                variant={leg.period === p ? "default" : "outline"}
                onClick={() => onChange({ ...leg, period: p })}
              >
                {p === "ALL" ? "すべて" : p === "AM" ? "午前" : "午後"}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Select
              value={leg.flightNo}
              onValueChange={(v) => onChange({ ...leg, flightNo: v })}
            >
              <SelectTrigger id={`${idPrefix}-flight`} className="w-full min-w-0 flex-1">
                <SelectValue placeholder="便を選択" />
              </SelectTrigger>
              <SelectContent>
                {flights.map((f) => (
                  <SelectItem key={f.flightNo} value={f.flightNo}>
                    {f.flightNo} {f.dep}→{f.arr}
                    <Badge variant="secondary" className="ml-2">
                      {f.period === "AM" ? "午前" : "午後"}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {calendarUrl && (
              <Button
                asChild
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${title}をカレンダーに登録`}
                >
                  <CalendarPlus />
                </a>
              </Button>
            )}
          </div>
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
  const [destination, setDestination] = useState("HKD")
  const [outbound, setOutbound] = useState<LegState>(emptyLeg)
  const [inbound, setInbound] = useState<LegState>(emptyLeg)
  const [copied, setCopied] = useState(false)

  const outboundFlights = useMemo(
    () => getFlights(origin, destination),
    [origin, destination]
  )
  const inboundFlights = useMemo(
    () => getFlights(destination, origin),
    [origin, destination]
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
        `${formatDateJp(returnDate)} ${airportLabel(destination)} → ${airportLabel(origin)}`
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

  const swapAirports = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto max-w-md space-y-3 p-3 pb-20">
        <header className="text-center">
          <h1 className="text-base font-bold">航空券予約依頼メッセージ作成</h1>
        </header>

        <Card className="gap-3 py-3">
          <CardContent className="space-y-3 px-3">
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1"
                size="sm"
                variant={tripType === "roundtrip" ? "default" : "outline"}
                onClick={() => setTripType("roundtrip")}
              >
                往復
              </Button>
              <Button
                type="button"
                className="flex-1"
                size="sm"
                variant={tripType === "oneway" ? "default" : "outline"}
                onClick={() => setTripType("oneway")}
              >
                片道
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="dep-date" className="text-xs">
                  出発日
                </Label>
                <input
                  id="dep-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="border-input bg-transparent box-border flex h-8 w-full min-w-0 rounded-md border px-2 py-1 text-sm shadow-xs"
                />
              </div>
              {tripType === "roundtrip" && (
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="ret-date" className="text-xs">
                    帰着日
                  </Label>
                  <input
                    id="ret-date"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="border-input bg-transparent box-border flex h-8 w-full min-w-0 rounded-md border px-2 py-1 text-sm shadow-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs" htmlFor="origin-select">
                  出発地
                </Label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger id="origin-select" className="w-full min-w-0" size="sm">
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
                className="size-8"
                onClick={swapAirports}
                aria-label="出発地と目的地を入れ替え"
              >
                ⇄
              </Button>
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs" htmlFor="destination-select">
                  目的地
                </Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger id="destination-select" className="w-full min-w-0" size="sm">
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
                <LegPicker
                  idPrefix="inbound"
                  title="復路"
                  date={returnDate}
                  origin={destination}
                  destination={origin}
                  leg={inbound}
                  onChange={setInbound}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-2 py-3">
          <CardHeader className="px-3">
            <CardTitle className="text-sm">メッセージプレビュー</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            <pre className="bg-muted whitespace-pre-wrap rounded-md p-2 text-sm">
              {message}
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="bg-background/95 fixed inset-x-0 bottom-0 border-t p-2 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button className="w-full" onClick={handleCopy}>
            {copied ? "コピーしました" : "メッセージをコピー"}
          </Button>
        </div>
      </div>
    </div>
  )
}
