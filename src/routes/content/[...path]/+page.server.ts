import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types"
import { getDoc } from "$lib";
import rawContent from "$lib/rawContent";

export const load:PageServerLoad = async (event) => {

  // For later, when this does paths
  // let [ lang, cat ] = event.params.path.split('/')

  let slug = event.params.path.replace(/.+\//, '');
  let path = Object.keys(rawContent).find(k => k.match(slug + '.md'))
  if (!path) throw error(404, { message: 'not found' })

  let raw = await rawContent[path]()

  return { content: getDoc(raw, path) }

}