import type { Localizable, MessageParam, MessageRef } from '../types/domain'
import { getActiveLocale, i18n } from './index'
import type { MessageKey } from './messageKeys'

type ListKind = 'or' | 'comma'

export function t(
  key: MessageKey,
  params: Record<string, MessageParam> = {},
  count?: number
): string {
  const resolvedParams = resolveParams(params)
  if (count === undefined) return i18n.global.t(key, resolvedParams)
  return i18n.global.t(key, resolvedParams, count)
}

export function translateMessage(message: MessageRef): string {
  return t(message.key, message.params)
}

export function translateText(text: Localizable): string {
  return typeof text === 'string' ? text : translateMessage(text)
}

export function formatList(items: string[], kind: ListKind): string {
  const listType = kind === 'or' ? 'disjunction' : 'unit'
  return new Intl.ListFormat(getActiveLocale(), { type: listType, style: 'short' }).format(items)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getActiveLocale()).format(value)
}

function resolveParams(params: Record<string, MessageParam>): Record<string, string | number> {
  const resolvedParams: Record<string, string | number> = {}
  for (const [name, param] of Object.entries(params)) resolvedParams[name] = resolveParam(param)
  return resolvedParams
}

function resolveParam(param: MessageParam): string | number {
  if (typeof param === 'string' || typeof param === 'number') return param
  if ('list' in param) return formatList(param.list.map(resolveListItem), param.kind)
  return translateMessage(param)
}

function resolveListItem(param: MessageParam): string {
  return String(resolveParam(param))
}
