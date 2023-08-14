import { persisted } from 'svelte-local-storage-store'
import { derived, writable, type Readable, type Writable, get } from 'svelte/store'
import type { Search, SearchHit, SearchStatus } from '$lib/search'

export const defaultAppSettings = {
  embeddingsLLM: 'Xenova/all-MiniLM-L6-v2',
  showSearchDetail: false,
  linesPerHit: 1,
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
  'provide a query for the database. Consider only the question below.',

  searchResultsFiltering: '',
  searchResultsFilteringTemp: .6,
  searchResultsFilteringPrompt: 'Given the context below, and only considering that context, '+
  'list the paragraphs that would be most helpful in answering the question below. '+
  'The context contains portions of paragraphs that may or may not be related to the question. '+
  'Choose the paragraphs that are most likely to answer the question if viewed in full. '+
  'Avoid paragraphs that are only citations or headings.',

  searchResultsProcessing: '',
  searchResultsProcessingTemp: .6,
  searchResultsProcessingPrompt: `You are a research assistant summarizing a selection of quotations for a researcher. `+
    `The researcher will have access to the same quotations. Given the quotations in the following context, and only considering `+
    `that context, complete the short essay beginning with the words "Here are some passages from the world's religious texts `+
    `related to your question about "{question}". From them, one might infer the following about "{question}":`,

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

export const currentSearch:Writable<Search> = persisted('currentSearch', { text:'', errors:[], settings: {...get(searchSettings)} })
export const currentSearchStatus:Writable<SearchStatus> = writable({ working:false, message:'' })

export const quickSearch:Writable<Search> = writable({ text:'', errors:[], settings:{ ...get(searchSettings) } })
export const quickSearchMessage:Writable<SearchStatus> = writable({ working:false, message:'' })

export const searchHistory:Writable<(Search)[]> = persisted('searchHistory', [])

export const currentSearchHit:Writable<SearchHit|undefined> = writable()
