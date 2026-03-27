/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { QUEST_SELECTED, QUEST_UNSELECTED, QUEST_STARTED, QUEST_BACKNEWTAB, QUEST_NEWTAB } from '../actions/index';

export default (state = null, action) => {
  switch (action.type) {
    case QUEST_SELECTED:
      return action.payload;
    case QUEST_STARTED:
      return action.payload;
    case QUEST_UNSELECTED:
      // In webapp: navigate to root (was: chrome.tabs.update to game.html)
      if(action.payload) {
        window.location.href = '/';
      }
      return null;
    case QUEST_BACKNEWTAB:
      window.location.href = '/';
      return action.payload;
    case QUEST_NEWTAB:
      if (window.location && window.location.pathname !== '/') {
        window.open('/', '_blank');
      }
      return action.payload;
    default:
      return state;
  }
};
