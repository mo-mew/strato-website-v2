const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
})

export function formatDisplayDate(value: string): string {
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return displayDateFormatter.format(
      new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    )
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return displayDateFormatter.format(parsed)
}
