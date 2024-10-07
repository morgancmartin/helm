import tw from 'tailwind-styled-components'
import { atom, useAtom } from 'jotai'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'


type Tab = 'inspect' | 'search' | 'edits'
const selectedTabAtom = atom<Tab>('search')

export default function Inspector() {
  return (
    <Container>
      <Tabs />
      <View />
    </Container>
  )
}

function View() {
  const [selected] = useAtom(selectedTabAtom)

  return (
    <div className="w-full h-full flex justify-center pt-6">
      {selected === 'inspect' && (
        <span className="text-white">{selected}</span>
      )}
      {selected === 'search' && (
        <SearchView />
      )}
      {selected === 'edits' && (
        <span className="text-white">{selected}</span>
      )}
    </div>
  )
}

function SearchView() {
  return (
    <div className="mt-1 w-full flex item-start h-4">
      <div className="relative">
        <MagnifyingGlassIcon className="h-4 w-4 absolute top-[50%] ml-2 text-gray-500" />
        <input
          className="outline-none h-8 placeholder:text-[14px] rounded-md pl-8 leading-3"
          placeholder="Search features"
        />
      </div>
    </div>
  )
}

function Tabs() {
  const [selected, setSelected] = useAtom(selectedTabAtom)
  const getChoose = (tab: Tab) => () => setSelected(tab)
  const selectedTabStyles = (tab: Tab) => selected === tab ? 'text-white' : 'text-gray-500'
  const selectedBorderStyles = (tab: Tab) => selected === tab ? 'border-[#A64200]' : 'border-[#726A5E]'

  return (
    <div className="w-full h-12">
      <div className="w-full h-full flex">
        <div
          className={`flex items-center cursor-pointer w-1/3 justify-center ${selectedTabStyles('inspect')}`}
          onClick={getChoose('inspect')}
        >
          <span>Inspect</span>
        </div>
        <div
          className={`flex items-center cursor-pointer w-1/3 justify-center ${selectedTabStyles('search')}`}
          onClick={getChoose('search')}
        >
          <span>Search</span>
        </div>
        <div
          className={`flex items-center cursor-pointer w-1/3 justify-center ${selectedTabStyles('edits')}`}
          onClick={getChoose('edits')}
        >
          <span>Edits</span>
        </div>
      </div>
      <div className="w-full h-full flex">
        <div className={`w-1/3 h-[1px] border-t ${selectedBorderStyles('inspect')}`}></div>
        <div className={`w-1/3 h-[1px] border-t ${selectedBorderStyles('search')}`}></div>
        <div className={`w-1/3 h-[1px] border-t ${selectedBorderStyles('edits')}`}></div>
      </div>
    </div>
  )
}

const Container = tw.div`
  flex
  flex-col
  h-full
  w-1/4
  pt-2
  pb-6
  px-5
`
