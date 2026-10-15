const timeZone = 'America/Sao_Paulo'

export function toCalendarDate(value?: string | Date): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(value))
}

export function inInclusiveRange(value: string | undefined, from: string, to: string): boolean {
  const calendarDate = toCalendarDate(value)
  const isAfterStart = !from || calendarDate >= from
  const isBeforeEnd = !to || calendarDate <= to
  return isAfterStart && isBeforeEnd
}

export function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}
