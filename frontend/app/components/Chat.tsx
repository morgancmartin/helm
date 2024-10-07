import tw from 'tailwind-styled-components'
import Conversation from './Conversation'
import Inspector from './Inspector'

export default function Chat() {
  return (
    <Container>
      <Conversation />
      <Inspector />
    </Container>
  )
}

const Container = tw.div`
  flex
  h-[90vh]
  w-[90vw]
  bg-black/25
  rounded-lg
`
