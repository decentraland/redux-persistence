import { createAction } from 'redux-actions'

export const LOAD = 'REDUX_PERSISTENCE_LOAD'
export const SAVE = 'REDUX_PERSISTENCE_SAVE'

export const load = createAction(LOAD)
export const save = createAction(SAVE)
