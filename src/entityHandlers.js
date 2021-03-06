import get from 'lodash/get'
import map from 'lodash/map'
import set from 'lodash/set'
import uniq from 'lodash/uniq'
import head from 'lodash/head'
import isArray from 'lodash/isArray'
import difference from 'lodash/difference'

import {
  capitalizeFirstLetter,
  nullifyIfIncludes,
  //  keepSortByKey,
} from './helpers'

const defaultLoadOptions = {
  mapToKey: false,
  withLoading: true,
  singular: false,
  withReplace: false,
  addToState: {},
}

const defaultDeleteOptions = {
  addToState: {},
}

export const createLoadHandler = (resourceType, options) => (
  state,
  { meta, payload, paged = null },
) => {
  const { mapToKey, withLoading, singular, withReplace, addToState } = {
    ...defaultLoadOptions,
    ...options,
  }

  const endpoint = get(meta, 'endpoint')

  const data = get(payload, `data.${resourceType}`, false)
  const metaData = get(payload, `data.meta[${endpoint}].data`, false)

  const payloadResource = map(metaData || data, 'id')

  const mappedResourceType = mapToKey || resourceType

  const nextState = {
    [mappedResourceType]: state[mappedResourceType],
  }

  if (singular) {
    set(nextState, mappedResourceType, head(payloadResource))
  } else {
    set(
      nextState,
      mappedResourceType,
      withReplace
        ? payloadResource
        : uniq([...get(state, mappedResourceType, []), ...payloadResource]),
    )
  }
  const addKey = mapToKey ? capitalizeFirstLetter(mapToKey) : ''

  if (withLoading) {
    nextState[`isLoaded${addKey}`] = true
    nextState[`isLoading${addKey}`] = false
  }

  if (paged) {
    nextState[`paged${addKey}`] = paged
  }

  return state.merge({ ...nextState, ...addToState })
}

// TODO: add coverage for lines 86, 87, 89
export const createDeleteHandler = (stateKey, options) => (
  state,
  { payload },
) => {
  const { addToState } = {
    ...defaultDeleteOptions,
    ...options,
  }
  const deletedIds = get(payload, 'deletedIds') || [get(payload, 'deletedId')]

  const stateValue = state[stateKey]

  return state.merge({
    [stateKey]: isArray(stateValue)
      ? difference(stateValue, deletedIds)
      : nullifyIfIncludes(deletedIds, stateValue),
    ...addToState,
  })
}
