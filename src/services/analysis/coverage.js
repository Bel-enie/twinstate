/**
 * What the engine could actually check.
 *
 * The rule set is small (a handful of curated interactions over a short
 * substance list). Anything the resolver could not identify arrives with no
 * tags, so it matches no rule and contributes nothing — silently. Without
 * this, a log containing an unrecognised drug still renders as teal
 * "all clear", which reads as "we checked this and it's fine" when the truth
 * is "we could not check this at all".
 *
 * Every reassuring statement in the UI should be qualified by `checkedAll`.
 */

import { SUBSTANCE_BY_ID } from '../mock/mockData.js'

/**
 * Stored items are `{ substanceId, label, unit, dose, frequency }` — the
 * definition is NOT attached (the engine resolves it via normalizeItems).
 * Resolve it the same way here, or every curated substance would be
 * mis-reported as "not checked".
 */
function defOf(item) {
  if (!item) return null
  return item.def || SUBSTANCE_BY_ID[item.substanceId] || null
}

/** An item is "checked" only if it carries tags the rules can actually match. */
export function isChecked(item) {
  const def = defOf(item)
  if (!def) return false
  if (def.source === 'generic') return false
  return Array.isArray(def.tags) && def.tags.length > 0
}

/** An item identified by the model rather than a curated/HOLON definition. */
export function isUnverified(item) {
  return defOf(item)?.source === 'ai'
}

/**
 * Coverage summary for a logged list.
 * @returns {{total:number, checked:number, unchecked:Array, unverified:Array,
 *            checkedAll:boolean, hasUnverified:boolean}}
 */
export function coverageOf(items = []) {
  const unchecked = []
  const unverified = []
  let checked = 0

  for (const it of items) {
    if (isChecked(it)) {
      checked += 1
      if (isUnverified(it)) unverified.push(it)
    } else {
      unchecked.push(it)
    }
  }

  return {
    total: items.length,
    checked,
    unchecked,
    unverified,
    checkedAll: unchecked.length === 0,
    hasUnverified: unverified.length > 0,
  }
}

/** Human label for an item, whatever shape it arrived in. */
export function labelOf(item) {
  return defOf(item)?.label || item?.label || item?.name || item?.substanceId || 'Unknown item'
}

/**
 * The honest version of "all clear". Never claims more than was checked.
 */
export function clearanceCopy(cov) {
  if (!cov.total) return { tag: 'Nothing logged yet', note: 'Add what you take to build your twin.' }
  if (cov.checkedAll) {
    return {
      tag: 'Nothing flagged',
      note: `Nothing risky among the ${cov.checked} item${cov.checked === 1 ? '' : 's'} we could check. This covers a limited set of known interactions — it is not a full medication review.`,
    }
  }
  const names = cov.unchecked.map(labelOf).join(', ')
  return {
    tag: 'Nothing flagged in what we could check',
    note: `We could not check ${cov.unchecked.length} item${cov.unchecked.length === 1 ? '' : 's'} (${names}). Nothing here means "no flag found", not "safe" — ask a pharmacist about anything we could not check.`,
  }
}
