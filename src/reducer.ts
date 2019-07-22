import simpleMerger from 'redux-storage-merger-simple'
import { Action } from 'redux-actions'
import { LOAD } from './actions'

export default function<T>(reducer, merger = simpleMerger) {
  return (state: T, action: Action<any>) => reducer(action.type === LOAD ? merger(state, action.payload) : state, action)
}
