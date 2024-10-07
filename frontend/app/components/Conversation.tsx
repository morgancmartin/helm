import tw from 'tailwind-styled-components'
import TextareaAutosize from 'react-textarea-autosize'
import { useState } from 'react'
import { atom, useAtom } from 'jotai'
import { v4 as uuid } from 'uuid'

import { useOnEnter } from '../hooks'

export const messagesAtom = atom<{ id: string; type: 'user' | 'model'; content: string }[]>([])

export default function Conversation() {
  /* const [messages, setMessages] = useState<{ content: string }[]>([]) */
  const [messages, setMessages] = useAtom(messagesAtom)
  const [message, setMessage] = useState('')

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
    </Container>
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
