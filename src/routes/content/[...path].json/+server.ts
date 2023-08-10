import { error, json, type RequestHandler } from "@sveltejs/kit";
import { getDoc } from "$lib";
import rawContent from "$lib/rawContent";

export const GET:RequestHandler = async (event) => {

  // For later, when this does paths
  // let [ lang, cat ] = event.params.path.split('/')
  if (!event.params.path) throw error(404, 'Not found.')
  let slug = event.params?.path.replace(/.+\//, '').replace(/\.json$/, '');
  let path = Object.keys(rawContent).find(k => k.match(slug + '.md'))
  if (!path) throw error(404, { message: 'not found' })

  let raw = await rawContent[path]()

  return json( getDoc(raw, path))

}