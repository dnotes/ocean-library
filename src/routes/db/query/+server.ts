export const prerender=false

import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { PINECONE_API_KEY } from "$env/static/private";

export const POST:RequestHandler = async ({request}) => {

  const data:{ vector:number[], limit:number } = await request.json()
  let body = {
    vector: data.vector,
    topK: data.limit,
    includeMetadata: true,
    includeValues: false,
  }

  let res
  try {

    res = await fetch('https://ocean-af77af9.svc.us-west1-gcp-free.pinecone.io/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': PINECONE_API_KEY,
      },
      body: JSON.stringify(body)
    })

    let status = res.headers.get('grpc-status')
    if (res.status === 200 && (!status || status === "0")) {
      return res
    }

    let txt = await res.text()
    console.log(txt)
    throw new Error(txt)

  }
  catch (err:any) {
    throw error(500, err)
  }

}