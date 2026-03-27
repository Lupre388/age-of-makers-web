/*
 * Age of Makers - Standalone Web App
 * Original: Salesforce (BSD-3-Clause)
 * Converted from Chrome Extension to Web App
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

import rootReducer from './reducers/index';
import aliases from './aliases/index';
import App from './scripts/game/components/app';
import './game.css';

// Alias middleware: intercepts "mock" actions and runs the alias function
const aliasMiddleware = (store) => (next) => (action) => {
  if (action.payload && action.payload.mock && aliases[action.type]) {
    const aliasedAction = aliases[action.type](action);

    // If the aliased action has a Promise payload, handle it
    if (aliasedAction.payload instanceof Promise) {
      return aliasedAction.payload.then((result) => {
        next({ type: action.type, payload: result });
      });
    }
    return next(aliasedAction);
  }
  return next(action);
};

const store = createStore(
  rootReducer,
  applyMiddleware(aliasMiddleware, thunk)
);

const container = document.getElementById('ageofmakers');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
