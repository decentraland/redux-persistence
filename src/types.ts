import { Action } from 'typesafe-actions'

export type StorageEngine<T> = {
  load(): PromiseLike<T>
  save(state: T): PromiseLike<void>
}

export type MiddlewareWhitelist = string[] | ((action: Action) => boolean)

export type MiddlewareOptions<T> = {
  /**
   * Return `true` for any action that should be accepted by the middleware.
   */
  filterAction?: (action: Action) => boolean

  /**
   * Transform and return a new state before saving to the psrovided storage engine.
   */
  transform?: (state: T) => T

  /**
   * Don't dispatch a `REDUX_PERSISTENCE_SAVE` action after saving to the provided storage engine, `false` by default.
   */
  disableDispatchSaveAction?: boolean

  /**
   * Handle any errors thrown while trying to save to the provided storage engine.
   */
  onError?: (err: Error) => void
}

export type ReduxStore<T> = {
  dispatch: (action: Action) => void
  getState: () => T
}

export type Loader<T> = {
  (store: ReduxStore<T>): PromiseLike<any>
}

export type StateMerger = {
  (oldState: any, newState: any): any
}
