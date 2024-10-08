import tw from 'tailwind-styled-components'
import { atom, useAtom } from 'jotai'
import { MagnifyingGlassIcon, ArrowUturnLeftIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { useEffect, useMemo, useRef } from 'react'
import debounce from 'lodash/debounce'
import { capitalize } from 'lodash'

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
        <EditView />
      )}
    </div>
  )
}

function useFeatureEditUpdater() {
  const [featureEdits, setFeatureEdits] = useAtom(featureEditsAtom)
  const getFeatureEditUpdater = (index: string) => (e: any) => {
    const edits = {
      ...featureEdits,
      [index]: { ...featureEdits[index], value: Number(e.target.value) }
    }
    console.log('SETTING FEATURE EDITS:', edits)
    setFeatureEdits(edits)
  }

  return {
    getFeatureEditUpdater
  }
}

function SearchView() {
  const [search, setSearch] = useAtom(searchAtom)
  const [searchResults] = useAtom(searchResultsAtom)
  const [featureEdits, setFeatureEdits] = useAtom(featureEditsAtom)
  const updateSearch = (e: any) => setSearch(e.target.value)
  const inputRef = useRef()
  const debouncedUpdate = useMemo(() => {
    return debounce(updateSearch, 300)
  }, [])

  const { getFeatureEditUpdater } = useFeatureEditUpdater()

  useEffect(() => {
    if (inputRef.current) {
      (inputRef.current as any).value = search
    }
  }, [inputRef.current])

  return (
    <div className="h-full flex flex-col w-full pt-1">
      <div className="w-full flex item-start h-8">
        <div className="relative w-full">
          <div className="h-full flex items-center w-4 absolute ml-2">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
          </div>
          <input
            className="outline-none h-8 placeholder:text-[14px] rounded-md pl-8 leading-3 w-full bg-transparent text-white"
            placeholder="Search features"
            onInput={debouncedUpdate}
            ref={inputRef as any}
          />
        </div>
      </div>
      <div className="flex flex-col w-full h-full gap-2">
        {Object.values(searchResults).map((result) => <Feature key={result.index} cardType="search" index={result.index} />)}
      </div>
    </div>
  )
}

function EditBadge({ value }:{value: number}) {
  const kind = value > 0 ? 'pos' : 'neg'
  const isPos = kind === 'pos'

  return (
    <div className={`text-xs rounded-lg px-1 font-bold ${isPos ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
      <span>{isPos ? '+' : '-'}{value}</span>
    </div>
  )
}

function Feature({ index, cardType }:{ index: string; cardType: 'search' | 'edit' }) {
  const [searchResults] = useAtom(searchResultsAtom)
  const [featureEdits, setFeatureEdits] = useAtom(featureEditsAtom)
  const feature = searchResults[index]
  const edit = featureEdits[index]
  const { getFeatureEditUpdater } = useFeatureEditUpdater()
  const reset = () => setFeatureEdits({
    ...featureEdits,
    [feature.index]: { ...featureEdits[index], value: 0 }
  })

  return (
    <div key={feature.index} className="flex flex-col justify-between h-[102px] w-[318px] p-4 bg-[#181a1b]/20 text-white">
      <div className="flex w-full">
        <div className="w-2/3">
          <span className="text-[13px]">{capitalize(feature.description)}</span>
        </div>
        <div className="flex w-1/3">
          <div className="w-1/2" />
          <div className="w-1/2 flex items-center justify-center" onClick={reset}>
            {cardType === 'search' ? (
              <ArrowUturnLeftIcon className="w-4 h-4 cursor-pointer" />
            ) : (
              <XMarkIcon className="w-4 h-4 cursor-pointer" />
            )}
          </div>
        </div>
      </div>
      <div className="flex w-full justify-between">
        <div className="flex justify-between w-full">
          <span className="text-xs w-[10%]">-10</span>
          <input
            className="!w-[70%]"
            type="range"
            min="-10"
            max="10"
            value={featureEdits[feature.index]?.value}
            onInput={getFeatureEditUpdater(feature.index)}
          />
          <span className="text-xs w-[10%]">+10</span>
        </div>
        <div className="w-6">
          {edit && !!edit.value && (
            <EditBadge value={edit.value} />
          )}
        </div>
      </div>
    </div>
  )
}

function EditView() {
  const [featureEdits] = useAtom(featureEditsAtom)

  useEffect(() => {
    console.log('FEATURE EDITS:', featureEdits)
  }, [])
  const [activeEdits] = useAtom(activeEditsAtom)
  /* const activeEdits = Object.values(featureEdits).filter((edit) => edit.value !== 0) */

  return (
    <div className="flex flex-col">
      {activeEdits.map((edit) => (
        <Feature cardType="edit" index={edit.index} />
      ))}
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
