import rawContent from '$lib/rawContent'
import { getDoc } from "$lib"
import { sortBy } from "lodash-es"
import type { LayoutServerLoad } from "./$types"

export const load:LayoutServerLoad = async (event) => {

  let promises = Object.entries(rawContent).map(async ([path,raw]) => {
    return getDoc(await raw(), path, false)
  })

  let allContent = sortBy((await Promise.all(promises)), ['sort'])

  return {
    allContent,
  }

}