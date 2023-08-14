import type { SearchHit } from './search'

export { getDoc, cleanText, sentenceSplitter, clauseSplitter } from './Doc.mjs'


export type DocMeta = {
  isDoc:true
  id?:string
  sort:string
  title:string
  collection?:string
  collectionIndex?:number
  author:string
  language:string
  category:string
  subcategory?:string
  description?:string
  date?:string
  words?:number
  slug:string
  url?:string
}

export type Doc = DocMeta & {
  markdown?:string
  blocks:string[]
}

export type LibraryTree = {
  [category:string]: {
    [author:string]: {
      [title:string]: (Doc|SearchHit)[]
    }
  }
}

// TODO: do this right, with modules and i18n
export const langcodes:{[key:string]:string} = {
  en: 'English'
}
export function displayLanguage(lang:string) {
  return langcodes?.[lang] ?? lang
}

// TODO: do this right, with modules and i18n
export const categories:{[key:string]:string} = {
  bahai: 'Bahá’í',
  jainism: 'Jain',
}
export function displayCategory(cat:string) {
  return categories?.[cat] ?? (cat?.[0]?.toUpperCase() + cat?.slice(1)) ?? 'error'
}
