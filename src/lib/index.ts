import yaml from 'js-yaml'

export type Doc = {
  id?:string
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
  markdown?:string
}

export function getDoc(raw:string, path:string, includeMarkdown = true):Doc {

  let [ language, category ] = path.replace(/.+\/content\//, '').split('/')
  let slug = path.replace(/.+\//, '').replace(/\.md$/, '');
  let [, yfm, markdown] = raw.split(/^---$/gm)

  let data:any = {
    language,
    category,
    slug,
    author: 'unknown',
    title: 'untitled',
  }

  try {
    data = yaml.load(yfm) as object
  }
  catch(e) {
    // the data did not load, just return the full text
    return { ...data, markdown: `***Error: metadata not loaded!***\n\n${raw}` }
  }

  let words = (data?.words ?? data?.wordsCount)
  if (typeof words !== 'undefined' && typeof words !== 'number') {
    words = parseInt(words.toString())
  }
  return {
    id: cleanText(data?.id),
    title: cleanText(data?.title) || '',
    author: cleanText(data?.author) || '',
    collection: cleanText(data?.collection || data?.collectionTitle),
    language,
    category,
    description: cleanText(data?.description),
    date: cleanText(data?.date),

    slug,
    markdown: includeMarkdown ? cleanText(markdown.trim()) : undefined
  }
}

export type LibraryTree = {
  [category:string]: {
    [author:string]: {
      [title:string]: Doc
    }
  }
}

export function cleanText(str:any) {
  if (str === undefined) return
  str = str
    ?.toString()
    ?.replace(/\B_([hH])/g, '͟h')

  return str
}

// TODO: do this right, with modules and i18n
export const langcodes:{[key:string]:string} = {
  en: 'English'
}
export function displayLanguage(lang:string) {
  return langcodes[lang] ?? lang
}

// TODO: do this right, with modules and i18n
export const categories:{[key:string]:string} = {
  bahai: 'Bahá’í',
  jainism: 'Jain',
}
export function displayCategory(cat:string) {
  return categories[cat] ?? cat[0].toUpperCase() + cat.slice(1)
}
