import { persisted } from 'svelte-local-storage-store'
import { derived, writable, type Readable, type Writable, get } from 'svelte/store'
import { yamlSearchHits, type Search, type SearchHit } from '$lib'
import { Pipeline, pipeline } from '@xenova/transformers'

export const defaultAppSettings = {
  embeddingsLLM: 'Xenova/all-MiniLM-L6-v2',
  categoriesHidden: <string[]> [],
  authorsHidden: <string[]> [],
}

export const ephemeralApiKey = writable('')

export type AppSettings = typeof defaultAppSettings

export const appSettings:Writable<AppSettings> = persisted('oceanSettings', defaultAppSettings)

export const defaultSearchSettings = {

  searchLimit: 100,

  categoriesHidden: <string[]> [],
  authorsHidden: <string[]> [],
  documentsHidden: <string[]> [],

  searchSort: <'ordered'|'scored'> 'ordered',

  searchTextPreprocessing: '',
  searchTextPreprocessingTemp: .6,
  searchTextPreprocessingPrompt: 'Given the following question as context, '+
  'provide a query for the database. Consider only the question below.\n\n'+
  'Question:\n{question}',
  // searchTextPreprocessingHistory: <{[key:string]:string}> {},

  searchResultsPreprocessing: 'Given the context below, and only considering that context, '+
  'list the paragraphs that would be most helpful in answering the question below. '+
  'The context contains portions of paragraphs that may or may not be related to the question. '+
  'Choose the paragraphs that are most likely to answer the question if viewed in full. '+
  'Avoid paragraphs that are only citations or headings.',
  searchResultsPreprocessingTemp: .6,
  searchResultsPreprocessingPrompt: '',
  // searchResultsPreprocessingHistory: <{[key:string]:string}> {},

  searchResultsProcessing: '',
  searchResultsProcessingTemp: .6,
  searchResultsProcessingPrompt: '',
  // searchResultsProcessingHistory: <{[key:string]:string}> {},

}

export type SearchSettings = typeof defaultSearchSettings

export const searchSettings:Writable<SearchSettings> = persisted('oceanSearchSettings', defaultSearchSettings)

export const defaultAgent = {
  name: '',
  model: '',
  url: '',
  apiKey: '',
  contextSize: 4,
}
export type AIAgent = typeof defaultAgent
export const defaultAgents:AIAgent[] = [
  {
    name: 'GPT 3.5 (4k)',
    model: 'gpt-3.5-turbo',
    url: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    contextSize: 4,
  },
  {
    name: 'GPT 3.5 (16k)',
    model: 'gpt-3.5-turbo-16k',
    url: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    contextSize: 16,
  },
  {
    name: 'GPT 4 (8k)',
    model: 'gpt-4',
    url: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    contextSize: 8,
  },
  {
    name: 'GPT 4 (32k)',
    model: 'gpt-4-32k',
    url: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    contextSize: 32,
  },
]

export const agents:Writable<AIAgent[]> = persisted('oceanAgents', defaultAgents)

export const currentSearch:Writable<Search> = persisted('currentSearch', { text:'', results:[], settings: {...get(searchSettings)} })
export const quickSearch:Writable<Search> = writable({ text:'', results:[], settings:{ ...get(searchSettings) } })

export const searchHistory:Writable<(Search)[]> = persisted('searchHistory', [])

export const currentSearchHit:Writable<SearchHit|undefined> = writable()

/**
 * This function can be used whenever generating embeddings.
 * It's done as a store so that the LLM can be set on the client, for testing or personalization.
 */
export const embeddingsGenerator = derived(appSettings, ($appSettings) => new FeatureExtractor($appSettings?.embeddingsLLM || defaultAppSettings.embeddingsLLM))

/**
 * This is the store used for preprocessing the user-submitted text for a search.
 */
export const textPreprocessor = derived([agents], ([$agents]) => {

  return async(text:string,settings:SearchSettings) => {
    let agent = settings.searchTextPreprocessing
    if (!agent) return text

  }

})

export type AgentResponse = { error?:boolean, message?:string, detail?:any}

export type SearchTextPreprocessorResponse = AgentResponse & { text:string }
export async function searchTextPreprocessor(search:Search):Promise<void> {

  if (!search.errors) search.errors = []
  const systemPrompt = 'You are an AI assistant functioning through an API endpoint. '+
  'Your response should be a string of search terms '+
  'suitable for generating vectors for searching in a vector database.'

  let allAgents = get(agents)
  let agentName = search?.settings?.searchTextPreprocessing
  let agent = allAgents.find(a => a.name === search?.settings?.searchTextPreprocessing)
  if (!agent) {
    search.errors.push({ error:true, message: `agent not found: "${agentName}"` })
    return
  }

  let prompt = search?.settings?.searchTextPreprocessingPrompt
  prompt = prompt?.includes('{question}') ? prompt.replace(/\{question\}/g, search.text) : `${prompt || ''}\n\nQuestion:\n${search.text}`

  try {
    let res = await fetch(agent.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': agent.apiKey || get(ephemeralApiKey),
      },
      body: JSON.stringify({
        model: agent.model,
        temperature: search.settings?.searchTextPreprocessingTemp ?? .6,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ]
      })
    })

    if (res.status !== 200) {
      search.errors.push({ error:true, message:`api error: ${res.status} ${res.statusText}`})
    }

    let item = await res.json()
    let returnText = item?.choices?.[0]?.message?.content

    search.textPreprocessed = returnText

  }
  catch(e:any) {
    search.errors.push({ error:true, message:`error: "${e?.message}"`})
  }

}

export type SearchResultsPreprocessingResponse = AgentResponse & { results:SearchHit[] }
export async function searchResultsPreprocessor ( search:Search ):Promise<void> {

  if (!search.errors) search.errors = []
  const systemPrompt = 'You are an AI assistant functioning through an API endpoint. '+
  'Your response should consist ONLY of an array of objects of the shape '+
  '{ id:string, blk:number } in JSON format.'

  let allAgents = get(agents)
  let agentName = search?.settings?.searchResultsPreprocessing
  let agent = allAgents.find(a => a.name === search?.settings?.searchResultsPreprocessing)
  if (!agent) {
    search.errors.push({ error:true, message: `agent not found: "${agentName}"` })
    return
  }

  let prompt = search?.settings?.searchResultsPreprocessingPrompt
  if (!prompt) {
    search.errors.push({ error:true, message: `no prompt found`})
    return
  }
  prompt = prompt?.includes('{question}') ? prompt.replace(/\{question\}/g, search.text) : `${prompt}\n\nQuestion:\n${search.text}`
  if (prompt?.includes('{query}')) prompt = prompt.replace(/\{query\}/g, search.textPreprocessed ?? search.text)

  let context = yamlSearchHits(search.results)
  prompt = prompt?.includes('{context}') ? prompt.replace(/\{context\}/g, context) : `${prompt}\n\nContext:\n${context}`

  try {
    let res = await fetch(agent.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': agent.apiKey || get(ephemeralApiKey),
      },
      body: JSON.stringify({
        model: agent.model,
        temperature: search.settings?.searchResultsPreprocessingTemp ?? .6,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ]
      })
    })

    if (res.status !== 200) {
      search.errors.push({ error:true, message:`api error: ${res.status} ${res.statusText}`})
      return
    }

    let item = await res.json()
    let returnText = item?.choices?.[0]?.message?.content

    let blocks:{ id:string, blk:number }[]
    try {
      blocks = JSON.parse(returnText)
    }
    catch(e) {
      search.errors.push({ error:true, message: 'could not parse data from AI agent.', detail:item })
      return
    }

    let results:SearchHit[] = []
    blocks.forEach(r => {
      let item = search.results.find(hit => r.id === hit.slug && r.blk === hit.blk)
      if (item) results.push(item)
    })

    search.filteredResults = results

  }
  catch(e:any) {
    search.errors.push({ error:true, message:`error: "${e?.message}"`})
  }

}

/**
 * This is the store that should be used whenever a search is performed.
 * It's done as a store so that the LLM can be set on the client, for testing or personalization.
 */
export const searchRunner = derived([embeddingsGenerator, searchHistory, searchSettings], ([$embeddingsGenerator, $searchHistory, $searchSettings]) => {
  return async (input:string|Search, searchStore?:Writable<Search>):Promise<Search> => {

    let search:Search = typeof input === 'string' ? { text:input, results:[], settings:{...$searchSettings} } : input

    if (!search.text || search.text.length <= 2) return {...search, message: 'More than two characters are required.'}

    search.errors = []
    if (searchStore) searchStore.set(search)

    // Preprocess the search text
    if (search.settings?.searchTextPreprocessing) {
      search.message = 'Pre-processing search query...'
      if (searchStore) searchStore.set(search)
      await searchTextPreprocessor(search)
      if (searchStore) searchStore.set(search)
    }

    // Generate the embeddings
    let embeddings = await $embeddingsGenerator.run(search.textPreprocessed ?? search.text)

    // Run the search
    try {
      search.message = 'Searching the database...'
      if (searchStore) searchStore.set(search)

      let res = await fetch('/db/query', {
        method: 'POST',
        body: JSON.stringify({
          embeddings,
          limit: search?.settings?.searchLimit ?? $searchSettings.searchLimit
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (res.status !== 200) {
        let message = await res.text()
        console.error(message)
        search.errors?.push({ error:true, message:'database query error: ' + message ?? '(unknown error)', detail:res })
        search.message = `Search request failed with the following message:\n${message ?? '(unknown error)'}`
        if (searchStore) searchStore.set(search)
        return search
      }

      let body = await res.json()
      body.matches.forEach((hit:any) => {
        let quote = search.results.find(q => q.blk === hit.metadata.blk)
        if (!quote) search.results = [...search.results, { ...hit.metadata, ...hit, s: [hit.metadata.s], texts:[], metadata:undefined }]
        else {
          quote.s.push(hit.metadata.s)
          quote.texts.push(hit.metadata.text)
        }
      })
      search.ready = true
      if (searchStore) searchStore.set(search)

    }
    catch(err:any) {
      console.error(err)
      search.errors.push({ error:true, message:`database query error: ${err?.message ?? '(unknown error)'}`, detail:err })
      search.message = `Search request failed with the following error:\n${err?.message ?? '(unknown error)'}`
      if (searchStore) searchStore.set(search)
      return search
    }

    // Preprocess the search results
    if (search.settings?.searchResultsPreprocessing) {
      search.message = 'Filtering initial results...'
      if (searchStore) searchStore.set(search)
      await searchResultsPreprocessor(search)
      if (searchStore) searchStore.set(search)
    }

    if (search.settings?.searchResultsProcessing) {

    }

    searchHistory.set([search, ...$searchHistory])
    return search
  }
})

class FeatureExtractor {
  ready=false
  generator:Promise<Pipeline>
  constructor(llm:string) {
    this.generator = pipeline('feature-extraction',llm)
    this.init()
  }
  async init() {
    await this.generator
    this.ready = true
  }
  async run(text:string):Promise<number[]> {
    let result = await (await this.generator)(text, {
      pooling: 'mean',
      normalize: true,
    })
    return Object.values(result.data)
  }
}

