export const prerender=true

import { error, json, type RequestHandler } from "@sveltejs/kit";
import { getDoc } from "$lib";
import { getContent } from "$lib/rawContent.server";
import fs from 'node:fs/promises'

export const GET:RequestHandler = async (event) => {

  // For later, when this does paths
  // let [ lang, cat ] = event.params.path.split('/')
  if (!event.params.path) throw error(404, 'Not found.')

  let slug = event.params?.path.replace(/.+\//, '').replace(/\.json$/, '');
  let path = getContent(slug)

  if (!path) throw error(404, { message: 'not found' })

  // load the file
  let raw = await fs.readFile(path, 'utf-8')

  return json( getDoc(raw, path))

}