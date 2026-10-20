import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * The one class combiner (shadcn convention). Every component copied from a
 * registry (21st.dev / Magic UI / Aceternity) expects this helper to exist,
 * so new blocks drop in without edits.
 */
export const cn = (...inputs) => twMerge(clsx(inputs))
