import { error, json } from "@sveltejs/kit"
import type { PageLoad } from "./$types"

export const load:PageLoad = async (event) => {

  // For later, when this does paths
  // let [ lang, cat ] = event.params.path.split('/')

  let content = await event.fetch(`/content/${event.params.path}.json`)
    .then(res => {
      if (res.status !== 200) {
        throw error(res.status, res.statusText)
      }
      return res.json()
    })
    .catch(err => {
      throw error(err.status || 500, err.message)
    })

  return { content }
}