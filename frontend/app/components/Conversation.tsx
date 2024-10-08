import tw from 'tailwind-styled-components'
import TextareaAutosize from 'react-textarea-autosize'
import { useState } from 'react'
import { atom, useAtom } from 'jotai'
import { v4 as uuid } from 'uuid'

import { useOnEnter } from '../hooks'
import { editingAtom } from './Inspector'

type Message = { id: string; type: 'user' | 'model'; content: string }
export const messagesAtom = atom<Message[]>([])

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

  return (
    <div className="h-full flex flex-col">
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

  return (
    <div className="h-full w-full flex flex-col">
      <div className="h-[70px] w-full flex">
        <div className="w-[90%]" />
        <div className="flex items-center justify-center w-[10%]">
          <span className="text-xs text-orange-500">Staged edits</span>
        </div>
      </div>
      <div className="h-full w-full flex">
        <div className="h-full w-1/2 bg-[#262A2B]">
          <div className="p-4 text-sm">Original</div>
          <div></div>
        </div>
        <div className="h-full w-1/2 bg-[#222426]">
          <div className="p-4 text-sm">Test preview</div>
          <div></div>
        </div>
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
  py-5
  px-10
  rounded-lg
`
