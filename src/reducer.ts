import simpleMerger from 'redux-storage-merger-simple'
import { Action } from 'redux-actions'
import { LOAD } from './actions'
import { StateMerger } from './types'

export default function<T>(reducer, merger: StateMerger = simpleMerger) {
  return (state: T, action: Action<any>) => reducer(action.type === LOAD ? merger(state, action.payload) : state, action)
}
