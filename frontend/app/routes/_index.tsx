import { useEffect, useState } from 'react'
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import axios from 'axios'
import { json, Jsonify } from "@remix-run/node"; // or cloudflare/deno
import { useAtom } from 'jotai'
import { promptGPT2 } from '../server-utils'
import { messagesAtom } from '../components/Conversation'
import { v4 as uuid } from 'uuid'

import Chat from '../components/Chat'

import { useOptionalUser } from "~/utils";

export const meta: MetaFunction = () => [{ title: "Remix Notes" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search')
  const message = url.searchParams.get('message')
  console.log('FOUND SEARCH: ', search)
  const options = {
    method: 'POST',
    url: 'https://www.neuronpedia.org/api/search-all',
    headers: {'Content-Type': 'application/json', 'X-Api-Key': 'YOUR_TOKEN'},
    data: {
      modelId: 'gpt2-small',
      sourceSet: 'res-jb',
      text: search,
      selectedLayers: ['6-res-jb'],
      sortIndexes: [1],
      ignoreBos: false
    }
  };

  let promptResponse = ''
  let searchResponse = null
  let searchResults = null

  if (message) {
    promptResponse = await promptGPT2(message)
  }

  try {
    if (search) {
      searchResponse = await axios.request(options)
      searchResults = (searchResponse as any).data
    }
    /* console.log(data); */
    /* return json(data); */
    return json({ searchResults, promptResponse })
  } catch (error) {
    return json({})
    console.error(error);
  }
}

export default function Index() {
  const user = useOptionalUser();
  const [features, setFeatures] = useState([])
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useAtom(messagesAtom)

  useEffect(() => {
    if (messages.length) {
      const message = messages[messages.length - 1]
      if (message.type === 'user') {
        setSearchParams({ message: message.content })
      }
    }
  }, [messages.length])

  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    console.log(data)
    if ((data as any).promptResponse) {
      setMessages([...messages, {
        id: uuid(),
        type: 'model',
        content: (data as any).promptResponse
      }])
      setSearchParams({})
    }
  }, [data])

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <div className="bg-[radial-gradient(circle_at_bottom,rgba(81,53,37,0.90)_0%,rgba(36,31,26,0.90)_100%)] h-screen flex items-center justify-center w-full">
        <Chat />
      </div>
    </main>
  );
}

