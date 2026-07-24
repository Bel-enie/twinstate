/**
 * Single source of truth for how each risk level looks & reads.
 * Warm, non-alarming palette (see tailwind.config risk.*).
 */
export const RISK = {
  calm: {
    key: 'calm',
    label: 'All clear',
    hex: '#3FB8A0',
    glow: 'rgba(63, 184, 160, 0.65)',
    chipBg: 'bg-emerald-50',
    chipText: 'text-emerald-700',
    ring: 'ring-emerald-200',
    dot: 'bg-risk-calm',
  },
  watch: {
    key: 'watch',
    label: 'Keep an eye on it',
    hex: '#F4B860',
    glow: 'rgba(244, 184, 96, 0.7)',
    chipBg: 'bg-amber-50',
    chipText: 'text-amber-700',
    ring: 'ring-amber-200',
    dot: 'bg-risk-watch',
  },
  caution: {
    key: 'caution',
    label: 'Time to change something',
    hex: '#EF8354',
    glow: 'rgba(239, 131, 84, 0.75)',
    chipBg: 'bg-orange-50',
    chipText: 'text-orange-700',
    ring: 'ring-orange-200',
    dot: 'bg-risk-caution',
  },
  urgent: {
    key: 'urgent',
    label: 'Act on this soon',
    hex: '#E0567A',
    glow: 'rgba(224, 86, 122, 0.8)',
    chipBg: 'bg-rose-50',
    chipText: 'text-rose-700',
    ring: 'ring-rose-200',
    dot: 'bg-risk-urgent',
  },
}

export const riskOf = (sev) => RISK[sev] || RISK.calm

export const CATEGORY_LABEL = {
  prescription: 'Prescription',
  otc: 'Over-the-counter',
  energy_drink: 'Energy drink',
  supplement: 'Supplement',
  herbal: 'Herbal',
}
