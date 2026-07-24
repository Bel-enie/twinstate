/**
 * Work out how to address a twin in copy.
 * - Your own twin (name "You") → first / second person ("Your", "you").
 * - A persona's twin ("Beloved, 21") → third person ("Beloved's", "Beloved").
 */
export function twinNaming(name) {
  const first = String(name || '').split(',')[0].trim()
  const isSelf = !first || first.toLowerCase() === 'you'
  return {
    first: isSelf ? 'You' : first,
    isSelf,
    Possessive: isSelf ? 'Your' : `${first}'s`, // sentence-start
    possessive: isSelf ? 'your' : `${first}'s`, // mid-sentence
    subject: isSelf ? 'you' : first, // "you" / "Beloved"
  }
}
