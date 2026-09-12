/** Joins class names, dropping anything falsy. CSS module lookups are `string | undefined`. */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value)).join(' ');
}
