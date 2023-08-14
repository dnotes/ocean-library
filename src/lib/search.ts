import { get, type Writable } from "svelte/store"
import { agents, ephemeralApiKey, searchSettings, type AIAgent, type SearchSettings, appSettings } from "./stores"
import yaml from 'js-yaml'
import { pipeline } from "@xenova/transformers"
import type { Doc } from "$lib"
import { sortBy } from "lodash-es"

export type SearchMeta = {
  slug:string
  blk:number
  s:number
  c:number
  title:string
  author:string
  collection:string
  language:string
  category:string
  date?:string
}

export type SearchHit = Omit<SearchMeta, 's'> & {
  score:number
  s:number[]
  text:string
  texts:string[]
}

export type Excerpt = SearchHit & {
  blocks: string[]
  blocksStart:number
  blocksEnd:number
}

export type Search = {

  text:string
  settings: SearchSettings
  errors:AgentError[]

  textPreprocessed?:string
  vector?:number[]
  results?:SearchHit[]
  filteredResults?:Excerpt[]
  compilation?:{slug:string,blk:number}[]
  summary?:string

}

export type SearchStatus = {
  working:boolean
  message:string
}

export function getSearchHitStubs(hits:SearchHit[]|undefined) {
  return (hits || []).map(hit => ({
    id: hit.slug,
    blk: hit.blk,
    text: hit.texts.join('...')
  }))
}

export async function getExcerpts(hits:SearchHit[]):Promise<Excerpt[]> {
  let docs:{[slug:string]:Doc} = {}
  for (let i=1; i<hits.length; i++) {
    let hit = hits[i] as Excerpt
    if (!docs[hit.slug]) docs[hit.slug] = await fetch(`/content/${hit.slug}.json`).then(res => res.json())
    hit.blocks = [(document?.createRange().createContextualFragment(docs[hit.slug].blocks[hit.blk]).textContent?.trim() || '')]
  }
  return hits as Excerpt[]
}

export function getExcerptStubs(excerpts:Excerpt[]|undefined) {
  return (excerpts || []).map(ex => ({
    id: ex.slug,
    blk: ex.blk,
    author: ex.author,
    title: ex.title,
    category: ex.category,
    text: ex.blocks.join('\n\n')
  }))
}

export function getContext(items:any[], maxLength:number):string {
  let strs = items.map(item => JSON.stringify(item))
  let chars=0
  let i=0
  for (i;i<items.length;i++) {
    chars+=strs[i].length
    if (chars > maxLength) break
  }
  return '[' + strs.slice(0,i).join(',') + ']'
}

export function charEstimate(KT:number):number {
  return (KT * 1000) * Math.E
}

export type AgentError = { message:string, detail?:any }

export type AgentRequestMessage = { role:string, content:string }
export function agentRequest(agent:AIAgent, userPrompt:string, systemPrompt:string, temperature:number=0.6) {
  temperature = temperature ?? 0.6
  return fetch(agent.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + agent.apiKey || get(ephemeralApiKey),
    },
    body: JSON.stringify({
      model: agent.model,
      temperature,
      messages: [
        { role:'system', content:systemPrompt },
        { role:'user', content:userPrompt },
      ],
    })
  })
}

function searchError(search:Search, message:string, detail?:any):Search {
  search.errors.push({ message, detail })
  return search
}

export async function preprocessSearchText(search:Search):Promise<Search> {

  const systemPrompt = 'You are an AI assistant functioning through an API endpoint. '+
  'Your response should be a string of no more than 15 search terms '+
  'suitable for generating vectors for searching in a vector database.'

  let allAgents = get(agents)
  let agentName = search.settings?.searchTextPreprocessing
  let agent = allAgents.find(a => a.name === search.settings?.searchTextPreprocessing)
  if (!agent) return searchError(search, `preprocessSearchText agent not found: "${agentName}"`)

  let prompt = search.settings?.searchTextPreprocessingPrompt
  prompt = prompt?.includes('{question}') ? prompt.replace(/\{question\}/g, search.text) : `${prompt || ''}\n\nQuestion:\n${search.text}`

  try {
    let res = await agentRequest(agent, prompt, systemPrompt, search.settings.searchTextPreprocessingTemp)

    if (res.status !== 200) return searchError(search, `preprocessSearchText api error: ${res.status} ${res.statusText}`, res)

    let item = await res.json()
    search.textPreprocessed = item?.choices?.[0]?.message?.content

  }
  catch(e:any) {
    return searchError(search, `error: "preprocessSearchText ${e?.message}"`, e)
  }

  return search
}

export async function generateEmbeddings(search:Search):Promise<Search> {

  try {
    const generator = await pipeline('feature-extraction', get(appSettings).embeddingsLLM)
    let result = await generator(search.textPreprocessed?.trim() || search.text, {
      pooling:'mean',
      normalize: true,
    })

    search.vector = Object.values(result.data)
  }
  catch (e:any) {
    return searchError(search, 'generateEmbeddings ' + e.message, e)
  }
  return search

}

export async function dbQuery(search:Search):Promise<Search> {

  let res = await fetch('/db/query', {
    method: 'POST',
    body: JSON.stringify({
      vector: search.vector,
      limit: search.settings?.searchLimit ?? get(searchSettings).searchLimit
    }),
    headers: {
      'Content-Type': 'application/json',
    }
  })

  if (res.status !== 200) {
    let message = await res.text()
    return searchError(search, `dbQuery api error: ${message}`, res)
  }

  let body = await res.json()
  search.results = []
  body.matches.forEach((hit:any) => {
    let quote = (search.results || []).find(q => q.blk === hit.metadata.blk)
    if (!quote) search.results = [...(search.results || []), { ...hit.metadata, ...hit, s: [hit.metadata.s], texts:[hit.metadata.text], metadata:undefined }]
    else {
      quote.s.push(hit.metadata.s)
      quote.texts.push(hit.metadata.text)
    }
  })

  return search

}

export async function filterResults(search:Search):Promise<Search> {

  const systemPrompt = 'You are an AI assistant functioning through an API endpoint. '+
  'Your response should consist ONLY of an array of objects of the shape '+
  '{ id:string, blk:number } in JSON format. Always answer in JSON format.'

  let allAgents = get(agents)
  let agentName = search.settings?.searchResultsFiltering
  let agent = allAgents.find(a => a.name === search.settings?.searchResultsFiltering)
  if (!agent) return searchError(search, `filterResults agent not found: "${agentName}"`)

  let prompt = search.settings?.searchResultsFilteringPrompt
  if (!prompt) return searchError(search, `filterResults no prompt found`)

  prompt = prompt?.includes('{question}') ? prompt.replace(/\{question\}/g, search.text) : `${prompt}\n\nQuestion:\n${search.text}`
  if (prompt?.includes('{query}')) prompt = prompt.replace(/\{query\}/g, search.textPreprocessed ?? search.text)

  let stubs = getSearchHitStubs(sortBy(search.results, 'score'))
  let chars = charEstimate(agent.contextSize - 2)
  let context = getContext(stubs, chars)
  prompt = prompt?.includes('{context}') ? prompt.replace(/\{context\}/g, context) : `${prompt}\n\nContext:\n${context}`

  try {
    let res = await agentRequest(agent, prompt, systemPrompt, search.settings?.searchResultsFilteringTemp)

    if (res.status !== 200) {
      let message = await res.text()
      return searchError(search, `filterResults api error: ${res.status} ${res.statusText} (${message})`, res)
    }

    let result = await res.json()
    let resultText = result?.choices?.[0]?.message?.content

    let blocks:{ id:string, blk:number }[]
    try {
      blocks = JSON.parse(resultText)
    }
    catch(e) {
      return searchError(search, 'filterResults could not parse data from AI agent.', result)
    }

    let results:SearchHit[] = []
    blocks.forEach(r => {
      let item = (search.results || []).find(hit => r.id === hit.slug && r.blk === hit.blk)
      if (item) results.push(item)
    })

    search.filteredResults = await getExcerpts(results)
    // TODO: remove duplicates
    search.compilation = search.filteredResults.map(hit => ({ slug: hit.slug, blk:hit.blk }))

  }
  catch(e:any) {
    return searchError(search, `filterResults error: "${e?.message}"`)
  }

  return search

}

export async function processResults(search:Search):Promise<Search> {

  let allAgents = get(agents)
  let agentName = search.settings?.searchResultsProcessing
  let agent = allAgents.find(a => a.name === search.settings?.searchResultsProcessing)
  if (!agent) return searchError(search, `processResults agent not found: "${agentName}"`)

  let prompt = search.settings?.searchResultsProcessingPrompt
  if (!prompt) return searchError(search, `processResults no prompt found`)

  prompt = prompt?.includes('{question}') ? prompt.replace(/\{question\}/g, search.text) : `${prompt}\n\nQuestion:\n${search.text}`
  if (prompt?.includes('{query}')) prompt = prompt.replace(/\{query\}/g, search.textPreprocessed ?? search.text)

  console.log(prompt)

  let excerpts = search.filteredResults?.length ? search.filteredResults : await getExcerpts(sortBy(search.results || [], 'score'))
  let stubs = getExcerptStubs(excerpts)
  let context = getContext(stubs, charEstimate(agent.contextSize - 2))
  prompt = prompt?.includes('{context}') ? prompt.replace(/\{context\}/g, context) : `${prompt}\n\nContext:\n${context}`

  console.log(prompt)

  try {
    let res = await agentRequest(agent, prompt, '', search.settings.searchResultsProcessingTemp)

    if (res.status !== 200) {
      let message = await res.text()
      return searchError(search, `processResults api error: ${res.status} ${res.statusText} (${message})`, res)
    }

    let result = await res.json()
    let resultText = result?.choices?.[0]?.message?.content

    search.summary = resultText

  }
  catch(e:any) {
    return searchError(search, `processResults error: "${e?.message}"`)
  }

  return search

}

export async function runSearch(search:Search, messageStore:Writable<SearchStatus>): Promise<void> {

  messageStore.set({ working:true, message:'Running search...' })
  if (search.text.length <= 2) {
    messageStore.set({ working:false, message:'Query too short, minimum 3 characters required.' })
    return
  }

  messageStore.set({ working:true, message:'Preprocessing search text...' })
  if (search.settings?.searchTextPreprocessing) await preprocessSearchText(search)

  messageStore.set({ working:true, message:'Generating embeddings...' })
  await generateEmbeddings(search)

  messageStore.set({ working:true, message:'Querying database...' })
  await dbQuery(search)
  if (!search.results?.length) {
    messageStore.set({ working:false, message:'Error: No results returned from database query.' })
    return
  }

  messageStore.set({ working:true, message:'Filtering results...' })
  if (search.settings?.searchResultsFiltering) await filterResults(search)

  messageStore.set({ working:true, message:'Processing results...' })
  if (search.settings?.searchResultsProcessing) await processResults(search)

  messageStore.set({ working:false, message:'' })

}