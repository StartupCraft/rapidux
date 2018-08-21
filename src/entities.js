import build from 'redux-object'
import { createSelector } from 'reselect'

import get from 'lodash/get'
import map from 'lodash/map'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'

import { createLoadHandler } from './entityHandlers'

import { capitalizeFirstLetter } from './helpers'

export const denormalize = (entities, type, id) =>
  build(entities, type, isArray(id) ? map(id, i => i.id || i) : id, {
    eager: true,
  })

export const getEntities = (
  getState,
  getData,
  { type, field, singular = false },
) =>
  createSelector(getState, getData, (state, data) => {
    const entity = field || type

    const addKey = !field || field === type ? '' : capitalizeFirstLetter(field)

    const all = {
      isLoading: state[`isLoading${addKey}`],
      isLoaded: state[`isLoaded${addKey}`],
    }

    const ids = state[entity]

    const entityKey = singular ? 'entity' : 'entities'

    if (!isEmpty(ids)) {
      all[entityKey] = denormalize(data, type, ids)
    } else {
      all[entityKey] = singular ? {} : []
    }

    return all
  })

export const createFields = (type, field, singular = false) => {
  const entity = field || type
  const addKey = !field || field === type ? '' : capitalizeFirstLetter(field)

  return {
    [entity]: singular ? null : [],
    [`isLoading${addKey}`]: false,
    [`isLoaded${addKey}`]: false,
  }
}

export const createReducerHandlers = (
  type,
  actionTypes,
  handlerOptions = null,
) => {
  const field = get(handlerOptions, 'mapToKey')
  const addKey = !field || field === type ? '' : capitalizeFirstLetter(field)

  return {
    [actionTypes.REQUEST]: state =>
      state.merge({
        [`isLoading${addKey}`]: true,
        [`isLoaded${addKey}`]: false,
      }),
    [actionTypes.SUCCESS]: createLoadHandler(type, handlerOptions),
    [actionTypes.FAILURE]: state =>
      state.merge({
        [`isLoading${addKey}`]: false,
        [`isLoaded${addKey}`]: false,
      }),
  }
}
