import { load as actionLoad } from './actions'
import { StorageEngine, Loader } from './types'

export function createLoader<T>(engine: StorageEngine): Loader<T> {
  return async store => {
    const dispatchLoad = state => store.dispatch(actionLoad(state))
    const newState = await engine.load()
    dispatchLoad(newState)
    return newState
  }
}
