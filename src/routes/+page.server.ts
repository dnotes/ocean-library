import type { PageServerLoad } from "./$types"
import markdownIt from 'markdown-it'
const md = markdownIt('commonmark')

const {'../../README.md':readme } = import.meta.glob('../../README.md', { eager:true, as:'raw' })
const html = md.render(readme)

export const load:PageServerLoad = async (event) => {
  return { html }
}