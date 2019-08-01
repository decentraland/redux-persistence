import { action } from 'typesafe-actions'

export const LOAD = 'REDUX_PERSISTENCE_LOAD'
export const load = <T>(state: T) => action(LOAD, state)
export type LoadAction<T> = { type: typeof LOAD; payload: T }

export const SAVE = 'REDUX_PERSISTENCE_SAVE'
export const save = <T>(state: T) => action(SAVE, state)
export type SaveAction<T> = { type: typeof SAVE; payload: T }
