import type { LayoutServerLoad } from "./$types"

import rawContent from '$lib/rawContent'
import { getDoc } from "$lib"
import { sortBy } from "lodash-es"

export const load:LayoutServerLoad = async (event) => {

  let promises = Object.entries(rawContent).map(async ([path,raw]) => {
    return getDoc(await raw(), path, false)
  })

  let allContent = sortBy((await Promise.all(promises)), ['category', 'author', 'title'])

  return {
    allContent
  }

}