import build from 'redux-object'
import { createSelector } from 'reselect'

import get from 'lodash/get'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
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
  { type, field, sorted = false, singular = false },
) =>
  createSelector(
    getState,
    getData,
    (state, data) => {
      const entity = field || type

      const addKey =
        !field || field === type ? '' : capitalizeFirstLetter(field)

      const paged = get(state, `paged${addKey}`)

      const all = {
        isLoading: state[`isLoading${addKey}`],
        isLoaded: state[`isLoaded${addKey}`],
        paged,
      }

      const ids = state[entity]

      const entityKey = singular ? 'entity' : 'entities'

      if (!isEmpty(ids)) {
        all[entityKey] = denormalize(data, type, ids)
      } else {
        all[entityKey] = singular ? {} : []
      }

      if (sorted && paged) {
        all[entityKey] = sortBy(all[entityKey], item =>
          all.paged.records.indexOf(item.id),
        )
      }

      return all
    },
  )

export const createFields = (type, field, singular = false) => {
  const entity = field || type
  const addKey = !field || field === type ? '' : capitalizeFirstLetter(field)

  const fields = {
    [entity]: singular ? null : [],
    [`isLoading${addKey}`]: false,
    [`isLoaded${addKey}`]: false,
  }

  if (!singular) {
    fields[`paged${addKey}`] = null
  }

  return fields
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
