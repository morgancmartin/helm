import tw from 'tailwind-styled-components'
import { atom, useAtom } from 'jotai'
import { MagnifyingGlassIcon, ArrowUturnLeftIcon, XMarkIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import { capitalize } from 'lodash'
import {
  searchAtom,
  featureEditsAtom,
  searchResultsAtom,
  stagedEditsAtom,
  activeEditsAtom,
  lastUserMessageAtom
} from '../client-state'

type Tab = 'inspect' | 'search' | 'edits'
export const selectedTabAtom = atom<Tab>('search')

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
    <div className="w-full h-[90%] flex justify-center pt-6">
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
  const [lastUserMessage] = useAtom(lastUserMessageAtom)
  const getFeatureEditUpdater = (index: string) => (e: any) => {
    const edits = {
      ...featureEdits,
      [index]: { ...featureEdits[index], value: Number(e.target.value), active: !lastUserMessage ? true : false }
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
  const [searchResults, setSearchResults] = useAtom(searchResultsAtom)
  const [featureEdits, setFeatureEdits] = useAtom(featureEditsAtom)
  const updateSearch = (e: any) => {
    /* cacheSearchResults() */
    setSearch(e.target.value)
  }
  const inputRef = useRef()
  const debouncedUpdate = useMemo(() => {
    return debounce(updateSearch, 300)
  }, [])

  const { getFeatureEditUpdater } = useFeatureEditUpdater()

  const cancelSearch = () => {
    console.log("CANCELING SEARCH")
    setSearch('')
  }

  useEffect(() => {
    if (inputRef.current) {
      (inputRef.current as any).value = search
    }
    if (inputRef.current && !search) {
      /* cacheSearchResults() */
    }
  }, [inputRef.current, search])

  return (
    <div className="h-full flex flex-col w-full pt-1 gap-2 overflow-hidden">
      <div className="w-full flex item-start h-8">
        <div className="relative w-full">
          <div className="h-full flex items-center w-4 absolute ml-2">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
          </div>
          <input
            className="outline-none h-8 placeholder:text-[14px] rounded-md pl-8 leading-3 w-[80%] bg-transparent text-white"
            placeholder="Search features"
            onInput={debouncedUpdate}
            ref={inputRef as any}
          />
          <div
            className="h-full flex items-center w-4 absolute right-0 top-0 mr-20 cursor-pointer"
            onClick={cancelSearch}
          >
            <XCircleIcon className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full h-full gap-2 overflow-y-auto pb-16 scrollbar-hide overflow-hidden">
        {Object.values(searchResults).filter((result) => result.visible).map((result) => <Feature key={result.index} cardType="search" index={result.index} />)}
      </div>
    </div>
  )
}

export function EditBadge({ value }:{value: number}) {
  const kind = value > 0 ? 'pos' : 'neg'
  const isPos = kind === 'pos'

  return (
    <div className={`text-xs rounded-lg px-1 font-bold ${isPos ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
      <span>{isPos ? '+' : ''}{value}</span>
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
    <div
      className={`flex flex-col justify-between h-[102px] min-h-[102px] w-[318px] p-4 bg-[#181a1b]/20 text-white rounded-lg ${!edit?.value ? '' : edit?.active ? 'border border-orange-500' : 'border border-orange-500 border-dashed'}`}
    >
      <div className="flex w-full overflow-hidden">
        <div className="w-2/3 overflow-hidden">
          <span className="text-[13px] text-ellipsis" title={feature?.description}>
            {capitalize(feature?.description)}
          </span>
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
            type="range"
            className="!w-[70%] h-2 bg-gray-200 rounded-lg overflow-hidden appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="-10"
            max="10"
            value={featureEdits[feature?.index]?.value}
            onInput={getFeatureEditUpdater(feature?.index)}
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
  const [stagedEdits] = useAtom(stagedEditsAtom)
  const [activeEdits] = useAtom(activeEditsAtom)
  /* const stagedEdits = Object.values(featureEdits).filter((edit) => edit.value !== 0) */

  return (
    <div className="flex flex-col gap-2 overflow-y-auto scrollbar-hide">
      {stagedEdits.map((edit) => (
        <Feature key={edit.index} cardType="edit" index={edit.index} />
      ))}
      {activeEdits.map((edit) => (
        <Feature key={edit.index} cardType="edit" index={edit.index} />
      ))}
    </div>
  )
}

function Tabs() {
  const [selected, setSelected] = useAtom(selectedTabAtom)
  const getChoose = (tab: Tab) => () => setSelected(tab)
  const selectedTabStyles = (tab: Tab) => selected === tab ? 'text-white' : 'text-gray-500'
  const selectedBorderStyles = (tab: Tab) => selected === tab ? 'border-[#A64200]' : 'border-[#726A5E]'
  const [featureEdits] = useAtom(featureEditsAtom)
  const [editCount, setEditCount] = useState(0)

  useEffect(() => {
    const editCount = Object.values(featureEdits).filter((edit) => !!edit.value).length
    setEditCount(editCount)
  }, [featureEdits])

  return (
    <div className="w-full h-12 min-h-12">
      <div className="w-full h-full flex">
        <div
          className={`flex items-center cursor-pointer w-1/2 justify-center ${selectedTabStyles('search')}`}
          onClick={getChoose('search')}
        >
          <span>Search</span>
        </div>
        <div
          className={`flex items-center cursor-pointer w-1/2 justify-center ${selectedTabStyles('edits')}`}
          onClick={getChoose('edits')}
        >
          <span>Edits{!!editCount ? ` (${editCount})` : ''}</span>
        </div>
      </div>
      <div className="w-full h-full flex">
        <div className={`w-1/2 h-[1px] border-t ${selectedBorderStyles('search')}`}></div>
        <div className={`w-1/2 h-[1px] border-t ${selectedBorderStyles('edits')}`}></div>
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
  overflow-hidden
`
