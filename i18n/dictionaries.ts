import 'server-only'
import type { Locale } from './config'

const dictionaries = {
    en: () => import('./en.json').then((module) => module.default),
    ar: () => import('./ar.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]()
