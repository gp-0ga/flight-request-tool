import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  choice1: string
  choice2: string
}

const emptyLeg: LegState = { period: "ALL", choice1: "", choice2: "" }

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
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
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
        <>
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

          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor={`${idPrefix}-choice1`}>
                第1希望
              </Label>
              <Select
                value={leg.choice1}
                onValueChange={(v) => onChange({ ...leg, choice1: v })}
              >
                <SelectTrigger id={`${idPrefix}-choice1`} className="w-full">
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
            </div>

            <div className="space-y-1">
              <Label className="text-xs" htmlFor={`${idPrefix}-choice2`}>
                第2希望（任意）
              </Label>
              <Select
                value={leg.choice2}
                onValueChange={(v) => onChange({ ...leg, choice2: v })}
              >
                <SelectTrigger id={`${idPrefix}-choice2`} className="w-full">
                  <SelectValue placeholder="便を選択" />
                </SelectTrigger>
                <SelectContent>
                  {flights
                    .filter((f) => f.flightNo !== leg.choice1)
                    .map((f) => (
                      <SelectItem key={f.flightNo} value={f.flightNo}>
                        {f.flightNo} {f.dep}→{f.arr}
                        <Badge variant="secondary" className="ml-2">
                          {f.period === "AM" ? "午前" : "午後"}
                        </Badge>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  const [tripType, setTripType] = useState<TripType>("roundtrip")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [origin, setOrigin] = useState("CTS")
  const [destination, setDestination] = useState("HKD")
  const [outbound, setOutbound] = useState<LegState>(emptyLeg)
  const [inbound, setInbound] = useState<LegState>(emptyLeg)
  const [notes, setNotes] = useState("")
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
    } else {
      if (outbound.choice1) {
        lines.push(`第1希望: ${flightLabel(outboundFlights, outbound.choice1)}`)
      }
      if (outbound.choice2) {
        lines.push(`第2希望: ${flightLabel(outboundFlights, outbound.choice2)}`)
      }
    }

    if (tripType === "roundtrip") {
      lines.push("")
      lines.push("【復路】")
      lines.push(
        `${formatDateJp(returnDate)} ${airportLabel(destination)} → ${airportLabel(origin)}`
      )
      if (inboundFlights.length === 0) {
        lines.push("該当便が見つかりません。事務担当に直接お問い合わせください。")
      } else {
        if (inbound.choice1) {
          lines.push(`第1希望: ${flightLabel(inboundFlights, inbound.choice1)}`)
        }
        if (inbound.choice2) {
          lines.push(`第2希望: ${flightLabel(inboundFlights, inbound.choice2)}`)
        }
      }
    }

    if (notes.trim()) {
      lines.push("")
      lines.push("【備考】")
      lines.push(notes.trim())
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
    notes,
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
      <div className="mx-auto max-w-md space-y-4 p-4 pb-24">
        <header className="pt-2 pb-1">
          <h1 className="text-lg font-bold">航空券予約依頼メッセージ作成</h1>
          <p className="text-muted-foreground text-xs">
            北海道内空港間の出張用（Teamsへの貼り付け用）
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">区間・日程</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1"
                variant={tripType === "roundtrip" ? "default" : "outline"}
                onClick={() => setTripType("roundtrip")}
              >
                往復
              </Button>
              <Button
                type="button"
                className="flex-1"
                variant={tripType === "oneway" ? "default" : "outline"}
                onClick={() => setTripType("oneway")}
              >
                片道
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dep-date">出発日</Label>
                <input
                  id="dep-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                />
              </div>
              {tripType === "roundtrip" && (
                <div className="space-y-1">
                  <Label htmlFor="ret-date">帰着日</Label>
                  <input
                    id="ret-date"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="border-input bg-transparent flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label>出発地</Label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
                onClick={swapAirports}
                aria-label="出発地と目的地を入れ替え"
              >
                ⇄
              </Button>
              <div className="flex-1 space-y-1">
                <Label>目的地</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">便の選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">備考（任意）</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="例：早めの便があれば優先でお願いします"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">メッセージプレビュー</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted whitespace-pre-wrap rounded-md p-3 text-sm">
              {message}
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="bg-background/95 fixed inset-x-0 bottom-0 border-t p-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button className="w-full" size="lg" onClick={handleCopy}>
            {copied ? "コピーしました" : "メッセージをコピー"}
          </Button>
        </div>
      </div>
    </div>
  )
}
