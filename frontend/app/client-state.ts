import { atom } from 'jotai'
// types
export type FeatureVector = [number, number, number]
export type Message = { id: string; type: 'user' | 'model'; content: string }
export type Feature = { description: string; modelId: string; layer: number; index: string; visible: boolean }
export type FeatureEdit = Pick<Feature, 'index'> & { value: number; active: boolean; }

// state
export const messagesAtom = atom<Message[]>([])
export const testPreviewMessageAtom = atom<Message | undefined | 'loading'>()
export const searchAtom = atom('')
export const searchResultsAtom = atom<Record<string, Feature>>({})
export const featureEditsAtom = atom<Record<string, FeatureEdit>>({})
export const featureEditValuesAtom = atom<string>(
  (get) => Object.values(get(featureEditsAtom)).filter((edit) => !!edit.value).map((edit) => edit.value).join(',')
)
export const stagedEditsAtom = atom(
  (get) => Object.values(get(featureEditsAtom)).filter((edit) => edit.value !== 0 && !edit.active)
)
export const activeEditsAtom = atom((get) => Object.values(get(featureEditsAtom)).filter((edit) => edit.active))
export const editingAtom = atom((get) => !!get(stagedEditsAtom).length)
