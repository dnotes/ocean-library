export const prerender=true
export const ssr=true

import { allMdFiles } from '$lib/rawContent.server'
import { getDoc } from "$lib"
import { sortBy } from "lodash-es"
import type { LayoutServerLoad } from "./$types"
import fs from 'node:fs/promises'

export const load:LayoutServerLoad = async (event) => {

  let allContent:any[] = []
  for (let i=1;i<allMdFiles.length;i++) {
    const filepath = allMdFiles[i]
    let raw = await fs.readFile(filepath, 'utf-8')
    allContent.push(getDoc(raw, filepath, false, false))
  }

  return {
    allContent: sortBy(allContent,'sort')
  }

}