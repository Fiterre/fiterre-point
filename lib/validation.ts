// 入力バリデーションユーティリティ

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** YYYY-MM-DD 形式の日付を検証 */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!DATE_REGEX.test(value)) return false
  const d = new Date(value + 'T00:00:00')
  return !isNaN(d.getTime())
}

/** HH:MM 形式の時刻を検証 */
export function isValidTime(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return TIME_REGEX.test(value)
}

/** UUID 形式を検証 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return UUID_REGEX.test(value)
}

/** 正の整数を検証 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/** 0以上の数値を検証 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && value >= 0
}
