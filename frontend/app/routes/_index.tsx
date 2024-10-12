import { useEffect, useState } from 'react'
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import axios from 'axios'
import { json } from "@remix-run/node"; // or cloudflare/deno
import { useAtom, atom } from 'jotai'
import { promptGPT2 } from '../server-utils'
import { messagesAtom } from '../client-state'
import { v4 as uuid } from 'uuid'
import {
  searchAtom,
  searchResultsAtom,
  featureEditsAtom,
  featureEditValuesAtom,
  testPreviewMessageAtom,
  stagedEditsAtom,
  activeEditsAtom,
  editingAtom,
  lastUserMessageAtom
} from '../client-state'
import { pick } from 'lodash'

import Chat from '../components/Chat'

import { useOptionalUser } from "~/utils";

export const meta: MetaFunction = () => [{ title: "Helm" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  console.log('SEARCH PARAMS:', url.searchParams)
  const search = url.searchParams.get('search')
  const message = url.searchParams.get('message')
  const features = url.searchParams.get('features')
  const layer = url.searchParams.get('layer')
  console.log('FOUND SEARCH: ', search)
  console.log('FOUND FEATURES:', features)
  const options = {
    method: 'POST',
    url: 'https://www.neuronpedia.org/api/explanation/search',
    headers: {'Content-Type': 'application/json', 'X-Api-Key': 'YOUR_TOKEN'},
    data: {
      modelId: 'gpt2-small',
      layers: [
        '4-res-jb',
        '5-res-jb',
        '6-res-jb',
        '7-res-jb',
        '8-res-jb',
        '9-res-jb',
        '10-res-jb',
        '11-res-jb',
        '12-res-jb',
      ],
      query: search,
    }
  };

  let promptResponse = ''
  let editPromptResponse = ''
  let searchResponse = null
  let searchResults = null

  if (message) {
    if (features) {
      console.log('GOT FEATURES:', features)
      editPromptResponse = await promptGPT2(message, features)
    } else {
      promptResponse = await promptGPT2(message)
    }
  }

  try {
    if (search) {
      searchResponse = await axios.request(options)
      searchResults = (searchResponse as any).data
    }
    /* console.log(data); */
    /* return json(data); */
    return json({ searchResults, promptResponse, editPromptResponse })
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
  const [search] = useAtom(searchAtom)
  const [searchResults, setSearchResults] = useAtom(searchResultsAtom)
  const [featureEdits, setFeatureEdits] = useAtom(featureEditsAtom)
  const [featureEditValues] = useAtom(featureEditValuesAtom)
  const [testPreviewMessage, setTestPreviewMessage] = useAtom(testPreviewMessageAtom)
  const [isEditing] = useAtom(editingAtom)
  const [stagedEdits] = useAtom(stagedEditsAtom)
  const [activeEdits] = useAtom(activeEditsAtom)
  const [updatedResults, setUpdatedResults] = useState(false)
  const [lastUserMessage] = useAtom(lastUserMessageAtom)

  useSearchParamSetter(() => {
    console.log('GOT LAST USER MESSAGE:', lastUserMessage, 'AND FEATUREEDITVALUES:', featureEditValues)
    const lastMessage = messages[messages.length - 1]
    if (lastUserMessage && !featureEditValues.length && lastMessage.type === 'user') {
      console.log('RETURNING MESSAGE PARAM:', { message: lastUserMessage.content })
      console.log('FEATURE EDIT VALUES:', featureEditValues)
      return { message: lastUserMessage.content }
    }
    return null
  }, [lastUserMessage, messages.length])

  const cacheSearchResults = () => {
    console.log('RESULTS BEFORE CACHE:', searchResults)
    const newResults = Object.values(searchResults).reduce((newResults, result) => ({
      ...newResults,
      [result.index]: { ...result, visible: false }
    }), {})
    console.log('RESULTS AFTER CACHE: ', newResults)
    setSearchResults(newResults)
  }


  useSearchParamSetter(() => {
    cacheSearchResults()
    if (search) {
      return { search }
    }
    return null
  }, [search])

  useSearchParamSetter(() => {
    console.log('RUNNING MESSAGE SETTER WITH EDIT VALUES:', featureEditValues)
    const lastMessage = messages[messages.length - 1]
    if (featureEditValues.length && lastUserMessage && lastMessage.type === 'user') {
      setTestPreviewMessage('loading')
      console.log('SEARCH RESULTS FOR EDIT GEN:', searchResults, stagedEdits)
      console.log('FEATURE EDIT VALUES:', featureEditValues)
      const stagedFeatures = stagedEdits.map(
        (edit) => [searchResults[edit.index].layer, edit.index, (300 / 10) * edit.value].join(',')
      ).join(';')

      const activeFeatures = activeEdits.map(
        (edit) => [searchResults[edit.index].layer, edit.index, (300 / 10) * edit.value].join(',')
      ).join(';')

      const features = stagedFeatures && activeFeatures ? `${stagedFeatures};${activeFeatures}` : stagedFeatures ? stagedFeatures : activeFeatures

      return { message: lastUserMessage.content, features  }
    }
    return null
  }, [featureEditValues, messages.length])

  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    console.log(data)
    if ((data as any).promptResponse) {
      console.log('ADDING PROMPT RESPONSE:', (data as any).promptResponse)
      setMessages([...messages, {
        id: uuid(),
        type: 'model',
        content: (data as any).promptResponse
      }])
      setSearchParams({})
    }
    if ((data as any).editPromptResponse) {
      if (stagedEdits.length){
        setTestPreviewMessage({
          id: uuid(),
          type: 'model',
          content: (data as any).editPromptResponse
        })
      } else if (activeEdits.length) {
        setMessages([...messages, {
          id: uuid(),
          type: 'model',
          content: (data as any).editPromptResponse
        }])
      }
      setSearchParams({})
    }
    if ((data as any).searchResults) {
      const value = (data as any).searchResults.results
      console.log('RETURNED SEARCH RESULTS:', value)
      const results = value.reduce((prevVal: any, feature: any) => ({
        ...prevVal,
        [feature.index]: {
          ...pick(feature, ['description', 'modelId', 'index']),
          layer: Number(feature.layer.split('')[0]),
          visible: true
        }
      }), {})
      console.log('SETTING SEARCH RESULTS:', { ...results, ...searchResults, })
      setSearchResults({ ...searchResults, ...results, })
      setUpdatedResults(true)
    }
  }, [data])

  useEffect(() => {
    if (updatedResults) {
      const newEdits = Object.values(searchResults).reduce((newEdits, result) => ({
        ...newEdits,
        [result.index]: { index: result.index, value: 0, active: false },
      }), {})
      console.log('FEATURE EDITS:', newEdits)
      setFeatureEdits({ ...newEdits, ...featureEdits })
      setUpdatedResults(false)
    }
  }, [updatedResults])

  useEffect(() => {
    if (!isEditing) {
      setTestPreviewMessage(undefined)
    }
  }, [isEditing])

  useEffect(() => {
    const newEdits = { ...featureEdits }
    Object.values(stagedEdits).forEach((staged) => {
      if (!staged.value && staged.active) {
        newEdits[staged.index].active = false
      }
    })
    setFeatureEdits(newEdits)
  }, [stagedEdits.length])

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <div className="bg-[radial-gradient(circle_at_bottom,rgba(81,53,37,0.90)_0%,rgba(36,31,26,0.90)_100%)] h-screen flex items-center justify-center w-full">
        <Chat />
      </div>
    </main>
  );
}

function useSearchParamSetter(getParams: () => object | null, triggers: any[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const params = getParams()
    if (params) {
      console.log('SETTING SEARCH PARAMS:', {...searchParams, ...params })
      setSearchParams({...searchParams, ...params })
    }
  }, triggers)
}
