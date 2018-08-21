import difference from 'lodash/difference'
import isArray from 'lodash/isArray'
import values from 'lodash/values'
import uniq from 'lodash/uniq'
import map from 'lodash/map'
import get from 'lodash/get'
import set from 'lodash/set'

import {
  capitalizeFirstLetter,
  nullifyIfIncludes,
  keepSortByKey,
} from './helpers'

const defaultLoadOptions = {
  mapToKey: false,
  withLoading: true,
  singular: false,
  withReplace: false,
  addToState: {},
  keepSorting: true,
}

const defaultDeleteOptions = {
  addToState: {},
}

export const createLoadHandler = (resourceType, options) => (
  state,
  { payload, paged = null },
) => {
  const {
    mapToKey,
    withLoading,
    singular,
    withReplace,
    addToState,
    keepSorting,
  } = {
    ...defaultLoadOptions,
    ...options,
  }

  const data = get(payload, `data.${resourceType}`, false)
  const meta = get(payload, 'data.meta', false)

  const payloadResource =
    keepSorting && !singular && meta ? keepSortByKey(meta, data, 'id') : data

  const mappedResourceType = mapToKey || resourceType

  const nextState = {
    [mappedResourceType]: state[mappedResourceType],
  }

  if (singular) {
    set(nextState, mappedResourceType, get(values(payloadResource), '0.id'))
  } else {
    set(
      nextState,
      mappedResourceType,
      withReplace
        ? map(payloadResource, 'id')
        : uniq([
            ...get(state, mappedResourceType, []),
            ...map(payloadResource, 'id'),
          ]),
    )
  }

  if (withLoading) {
    const addKey = mapToKey ? capitalizeFirstLetter(mapToKey) : ''
    nextState[`isLoaded${addKey}`] = true
    nextState[`isLoading${addKey}`] = false
  }

  if (paged) {
    nextState.paged = paged
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
