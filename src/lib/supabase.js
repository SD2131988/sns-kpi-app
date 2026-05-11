import { createClient } from '@supabase/supabase-js'

// .env.local に設定してください
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const PLATFORMS = ['X', 'TikTok', 'Instagram', 'YouTube']
export const BRANDS = ['DS', 'UNY']
export const REGIONS = ['国内', 'グローバル']

export const PLATFORM_COLORS = {
  X: '#378ADD',
  TikTok: '#D4537E',
  Instagram: '#D85A30',
  YouTube: '#E24B4A',
}

export const BRAND_COLORS = {
  DS: '#1D9E75',
  UNY: '#7F77DD',
}

export function fmt(n) {
  if (!n || n === 0) return '0'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.round(n).toLocaleString()
}

export function getPrevMonth(m) {
  const [y, mo] = m.split('-').map(Number)
  if (mo === 1) return `${y - 1}-12`
  return `${y}-${String(mo - 1).padStart(2, '0')}`
}

export function achievementClass(rate) {
  if (!rate || rate <= 0) return ''
  if (rate >= 1.1) return 'ach-good'
  if (rate >= 0.9) return 'ach-mid'
  return 'ach-bad'
}
