import { persisted } from 'svelte-local-storage-store'
import { derived, readable, writable, type Readable, type Writable } from 'svelte/store'
import type { Search, SearchHit } from '$lib'
import { Pipeline, pipeline } from '@xenova/transformers'
import { sortBy } from 'lodash-es'

export const defaultSettings = {
  embeddingsLLM: 'Xenova/all-MiniLM-L6-v2',
  searchCount: 100,
  categoriesHidden: <string[]> [],
  authorsHidden: <string[]> [],
}

export const settings:Writable<typeof defaultSettings> = persisted('oceanSearchSettings', defaultSettings)

export const currentSearch:Writable<Search> = persisted('currentSearch', { text:'', results:[] })
export const quickSearch:Writable<Search> = writable({ text:'', results:[]})

export const searchHistory:Writable<(Search)[]> = persisted('searchHistory', [])

export const currentSearchHit:Writable<SearchHit|undefined> = writable()

/**
 * This function can be used whenever generating embeddings.
 * It's done as a store so that the LLM can be set on the client, for testing or personalization.
 */
export const embeddingsGenerator = derived(settings, ($settings) => new FeatureExtractor($settings?.embeddingsLLM || defaultSettings.embeddingsLLM))

/**
 * This is the store that should be used whenever a search is performed.
 * It's done as a store so that the LLM can be set on the client, for testing or personalization.
 */
export const searchRunner = derived([embeddingsGenerator, searchHistory, settings], ([$embeddingsGenerator, $searchHistory, $settings]) => {
  return async (text:string, force = false):Promise<Search> => {

    let search:Search = { text, count:$settings.searchCount, results:[] }

    if (!text || text.length <= 2) return {...search, message: 'More than two characters are required.'}

    // Check for an existing search
    let idx = $searchHistory.findIndex(item => item.text === text)
    if (idx > -1) {
      search = ($searchHistory.splice(idx,1))[0]
      $searchHistory = [search, ...$searchHistory]
    }
    else {
      $searchHistory = [search, ...$searchHistory]
    }

    if (search.results.length && !force) return search

    // Generate the embeddings
    let embeddings = await $embeddingsGenerator.run(search.text)

    // Run the search
    try {
      let res = await fetch('/db/query', {
        method: 'POST',
        body: JSON.stringify({
          embeddings,
          count: search?.count ?? $settings.searchCount
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (res.status !== 200) {
        let message = await res.text()
        console.error(message)
        return {...search, message:`Search request failed with the following message:\n${message ?? '(unknown error)'}`}
      }

      let body = await res.json()
      body.matches.forEach((hit:any) => {
        let quote = search.results.find(q => q.blk === hit.metadata.blk)
        if (!quote) search.results = [...search.results, { ...hit.metadata, ...hit, s: [hit.metadata.s], metadata:undefined }]
        else quote.s.push(hit.metadata.s)
      })
      search.results = sortBy(search.results,'score').reverse()
      search.ready = true
      return search

    }
    catch(err:any) {
      console.error(err)
      return {...search, message:`Search request failed with the following error:\n${err?.message ?? '(unknown error)'}`}
    }

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

