const PREFIX = '[redux-persistence]'

export const receivedFunctionalAction = () =>
  `${PREFIX} ACTION IGNORED! Actions should be objects` +
  ` with a type property but received a function! Your` +
  ` function resolving middleware (e.g. redux-thunk) must be` +
  ` placed BEFORE redux-storage!`

export const receivedNonObjectAction = (action: any) =>
  `${PREFIX} ACTION IGNORED! Actions should be objects` + ` with a type property but received: ${action}`

export const missingActionType = () => `${PREFIX} ACTION IGNORED! Action objects should have a type property.`

export const defaultErrorHandler = () =>
  `${PREFIX} Using default error handler, specify your own using the onError option when creating the middleware`
