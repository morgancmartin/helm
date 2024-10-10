import tw from 'tailwind-styled-components'
import TextareaAutosize from 'react-textarea-autosize'
import { useState, useRef, useEffect } from 'react'
import { useAtom } from 'jotai'
import { v4 as uuid } from 'uuid'

import { useOnEnter } from '../hooks'
import {
  editingAtom,
  messagesAtom,
  testPreviewMessageAtom,
  Message,
  stagedEditsAtom,
  FeatureEdit,
  searchResultsAtom,
  featureEditsAtom,
  activeEditsAtom
} from '../client-state'
import { XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/solid'

import { EditBadge, selectedTabAtom } from './Inspector'
import { capitalize } from 'lodash'

export default function Conversation() {
  /* const [messages, setMessages] = useState<{ content: string }[]>([]) */
  const [messages, setMessages] = useAtom(messagesAtom)
  const [message, setMessage] = useState('')
  const [isEditing] = useAtom(editingAtom)

  const updateMessage = (e: any) => setMessage(e.target.value)

  const { onKeyDown } = useOnEnter(() => {
    console.log('message: ', message)
    console.log('messages: ', messages)
    setMessages([...messages, { id: uuid(), type: 'user', content: message }])
    setMessage('')
    console.log('message: ', message)
    console.log('messages: ', messages)
  })

  return (
    <Container>
      {!isEditing && (<BaseChat {...{ messages, onKeyDown, updateMessage, message }} />)}
      {isEditing && <EditStaging />}
    </Container>
  )
}

function BaseChat({
  messages,
  onKeyDown,
  updateMessage,
  message
}:{
  messages: Message[];
  onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement>;
  updateMessage: React.ChangeEventHandler<HTMLTextAreaElement>;
  message: string
}) {
  const [activeEdits] = useAtom(activeEditsAtom)

  return (
    <div className="h-full flex flex-col pb-5">
      {!!activeEdits.length && <EditsRow edits={activeEdits} kind="active" />}
      <div className="h-full flex flex-col gap-8">
        {messages.map((message) => (
          <span
            key={message.id}
            className={`w-fit p-4 rounded-md  ${message.type === 'user' ? 'self-end bg-[#083667] text-white' : 'self-start text-white bg-[#262A2B]'}`}>
            {message.content}
          </span>
        ))}
      </div>
      <TextareaAutosize
        className="w-full resize-none overflow-hidden"
        placeholder="Start the conversation"
        onKeyDown={onKeyDown}
        onChange={updateMessage}
        value={message}
      />
    </div>
  )
}

function EditStaging() {
  const [messages] = useAtom(messagesAtom)
  const [testPreviewMessage] = useAtom(testPreviewMessageAtom)
  const [stagedEdits] = useAtom(stagedEditsAtom)
  const [featureEdits, setFeatureEdits] = useAtom(featureEditsAtom)
  const lastMessage = messages[messages.length - 1]
  const [activeEdits] = useAtom(activeEditsAtom)

  const cancelEdits = () => {
    const newEdits = Object.values(featureEdits).reduce((newEdits, featureEdit) => ({
      ...newEdits,
      [featureEdit.index]: featureEdit.active ? featureEdit : { ...featureEdit, value: 0 }
    }), {})
    setFeatureEdits(newEdits)
  }

  const applyEdits = () => {
    const newEdits = Object.values(featureEdits).reduce((newEdits, featureEdit) => ({
      ...newEdits,
      [featureEdit.index]: featureEdit.value ? { ...featureEdit, active: true } : featureEdit
    }), {})
    setFeatureEdits(newEdits)
  }

  return (
    <div className="h-full w-full flex flex-col">
      {!!activeEdits.length && <EditsRow edits={activeEdits} kind="active" />}
      <EditsRow edits={stagedEdits} kind="staged" />
      <div className="h-full w-full flex">
        <div className="h-full w-1/2 bg-[#262A2B]">
          <div className="p-4 text-xs text-white">Original</div>
          <div className="px-4 text-white">{lastMessage?.content}</div>
        </div>
        <div className="h-full w-1/2 bg-[#222426]">
          <div className="p-4 text-xs text-white">Test preview</div>
          <div className="px-4 text-white">{testPreviewMessage === 'loading' ? (
              <ArrowPathIcon className="animate-spin h-8 w-8 text-blue-500" />
          ) : testPreviewMessage?.content}</div>
        </div>
      </div>
      <div className="h-[90px] w-full flex justify-end">
        <div className="flex h-full w-64 gap-2 justify-around items-center">
          <button
            className="w-[40%] h-12 bg-[#3B4042] rounded-lg text-[#fdd2b6] flex items-center"
            onClick={cancelEdits}
          >
            <span className="w-[66%]">Cancel</span>
            <div className="w-[33%] h-full flex items-center justify-center">
              <XMarkIcon className="w-5 h-5" />
            </div>
          </button>
          <button
            className="w-[40%] h-12 bg-[#26582F] rounded-lg text-[#fdd2b6] flex items-center"
            onClick={applyEdits}
          >
            <span className="w-[66%]">Apply</span>
            <div className="w-[33%] h-full flex items-center justify-center">
              <CheckIcon className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

function EditsRow({ edits, kind }:{ edits: FeatureEdit[]; kind: 'staged' | 'active' }) {
  const containerRef = useRef()
  const [selected, setSelected] = useAtom(selectedTabAtom)

  const setInspectorEdit = () => setSelected('edits')

  useEffect(() => {
    if (containerRef.current) {
      const element: any = containerRef.current
      element.addEventListener("wheel", (e: any) => {
        if (e.deltaY > 0) {
          (containerRef.current as any).scrollLeft += 100
          e.preventDefault()
        } else {
          (containerRef.current as any).scrollLeft -= 100
          e.preventDefault()
        }
      })
    }
  }, [containerRef.current])

  return (
    <div className="h-[70px] w-full flex">
      <div
        className="w-[90%] flex items-center gap-2 overflow-x-auto scrollbar-hide"
        ref={containerRef as any}
      >
        {edits.map((edit) => (
          <EditTile key={edit.index} activeEdit={edit} kind={kind} />
        ))}
      </div>
      <div className="flex items-center justify-center w-[10%] cursor-pointer" onClick={setInspectorEdit}>
        <span className="text-xs text-orange-500">{capitalize(kind)} edits ({edits.length})</span>
      </div>
    </div>
  )
}

function EditTile({ activeEdit, kind }:{ activeEdit: FeatureEdit; kind: 'active' | 'staged' }) {
  const [searchResults] = useAtom(searchResultsAtom)
  const feature = searchResults[activeEdit.index]
  const [featureEdits, setFeatureEdits] = useAtom(featureEditsAtom)
  const reset = () => setFeatureEdits({
    ...featureEdits,
    [feature.index]: kind === 'active' ? {  ...featureEdits[feature.index], value: 0, active: false } : { ...featureEdits[feature.index], value: 0 }
  })

  return (
    <div className={`w-[287px] min-w-[287px] h-[38px] bg-[#262A2B] rounded-full flex items-center border border-orange-500 ${kind === 'staged' ? 'border-dashed' : ''}`}>
      <div className="flex w-[15%] items-center justify-center">
        <EditBadge value={activeEdit.value} />
      </div>
      <span className="text-xs text-white w-[80%] text-ellipsis whitespace-nowrap overflow-hidden">
        {feature?.description}
      </span>
      <div className="flex w-[13%] items-center justify-center cursor-pointer" onClick={reset}>
        <XMarkIcon className="w-4 h-4 text-[#9D9D9A]" />
      </div>
    </div>
  )
}

const Container = tw.div`
  flex
  flex-col
  h-full
  w-3/4
  border-slate-500
  pt-5
  px-10
  rounded-lg
`
