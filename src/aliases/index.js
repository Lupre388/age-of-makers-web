/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SET_NEW_PLAYER } from '../actions'
import { stageStatus } from '../scripts/_utils';
import yaml from 'js-yaml';

// =============================================
//    STORAGE ADAPTER (replaces chrome.storage)
// =============================================

const storage = {
  local: {
    get(keys, callback) {
      if (Array.isArray(keys)) {
        const items = {};
        keys.forEach(key => {
          const val = localStorage.getItem('aom_local_' + key);
          if (val !== null) items[key] = JSON.parse(val);
        });
        callback(items);
      } else {
        const val = localStorage.getItem('aom_local_' + keys);
        const items = {};
        if (val !== null) items[keys] = JSON.parse(val);
        callback(items);
      }
    },
    set(obj, callback) {
      Object.entries(obj).forEach(([key, value]) => {
        localStorage.setItem('aom_local_' + key, JSON.stringify(value));
      });
      if (callback) callback();
    },
    remove(keys, callback) {
      const keyArr = Array.isArray(keys) ? keys : [keys];
      keyArr.forEach(key => localStorage.removeItem('aom_local_' + key));
      if (callback) callback();
    }
  },
  sync: {
    get(keys, callback) {
      if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          const val = localStorage.getItem('aom_sync_' + key);
          if (val !== null) result[key] = JSON.parse(val);
        });
        callback(result);
      } else {
        const val = localStorage.getItem('aom_sync_' + keys);
        const result = {};
        if (val !== null) result[keys] = JSON.parse(val);
        callback(result);
      }
    },
    set(obj, callback) {
      Object.entries(obj).forEach(([key, value]) => {
        localStorage.setItem('aom_sync_' + key, JSON.stringify(value));
      });
      if (callback) callback();
    },
    remove(keys, callback) {
      const keyArr = Array.isArray(keys) ? keys : [keys];
      keyArr.forEach(key => localStorage.removeItem('aom_sync_' + key));
      if (callback) callback();
    }
  }
};

// =============================================
//            UTILS
// =============================================

const middlewarePromise = (originalAction, promise) => {
  if (originalAction.payload && originalAction.payload.mock) {
    return {
      type: originalAction.type,
      payload: promise
    };
  }
  else {
    return originalAction;
  }
}

const getChromeStorage = (originalAction, itemName, errCallback) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    storage.local.get(itemName, (items) => {
      let item = items[itemName]
      if (item) {
        resolve(item);
      }
      else {
        console.log('Item not found: ', itemName);
        errCallback(resolve);
      }
    })
  }));
}

const getChromeSyncStorage = (originalAction, itemName, errorCb) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    storage.sync.get(itemName, (result) => {
      if (result && result[itemName]) {
        resolve(result[itemName]);
      }
      else {
        errorCb(resolve);
      }
    })
  }));
}

const setChromeSyncStorage = (originalAction, newStorageObj, cb) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    storage.sync.set(newStorageObj, () => {
      cb(resolve);
    });
  }));
}

const removeChromeSyncStorage = (originalAction, itemName, cb) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    storage.sync.remove(itemName, () => {
      cb(resolve);
    });
  }));
}

const getFullQuestWithAchievements = (callback) => {
  storage.sync.get(['players', 'activePlayer'], (storageData) => {
    if (storageData && storageData.players && storageData.activePlayer) {
      if (storageData.players[storageData.activePlayer]) {
        let achievements = storageData.players[storageData.activePlayer].achievements[storageData.players[storageData.activePlayer].journey];

        storage.local.get(['quests', 'ages', 'areas', 'credits'], (items) => {
          let quests = items.quests;
          let ages = items.ages;
          let areas = items.areas;
          let credits = items.credits;
          console.log('Achievements: ', achievements, quests, ages, areas, credits);

          if (quests && ages && areas) {
            if (achievements && achievements.quests) {
              for(let achievedQuestId of Object.keys(achievements.quests)) {
                let achievement = achievements.quests[achievedQuestId];
                let achievedQuest = quests[achievedQuestId];

                if (achievedQuest) {
                  for(let stage of achievedQuest.stages) {
                    if (achievement.stageNumber !== null && stage.order <= achievement.stageNumber) {
                      stage.status = stageStatus.STATUS_COMPLETE;
                    }
                    else if (stage.order === achievement.stageNumber+1) {
                      stage.status = stageStatus.STATUS_INPROGRESS;
                    }
                    else {
                      stage.status = stageStatus.STATUS_NEW;
                    }

                    if(achievement.showcasesVisited && achievement.showcasesVisited !== {}) {
                      for(let visitedStageOrder of Object.keys(achievement.showcasesVisited)) {
                        if (stage.order === parseInt(visitedStageOrder)) {
                          let showcaseResults = achievement.showcasesVisited[visitedStageOrder];

                          for(let visitedShowcaseOrder of Object.keys(showcaseResults)) {
                            for(let showcaseItem of stage.showcaseItems) {
                              if (showcaseItem.order === parseInt(visitedShowcaseOrder)) {
                                showcaseItem.status = stageStatus.STATUS_COMPLETE;

                                if (typeof showcaseResults[visitedShowcaseOrder] === "object") {
                                  showcaseItem.results = showcaseResults[visitedShowcaseOrder];
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  };

                  if (achievement.stageNumber !== null && ( achievedQuest.stages.length === 0 || achievement.stageNumber >= achievedQuest.stages[achievedQuest.stages.length - 1].order)
                   && ( !achievedQuest.quiz || (achievedQuest.quiz && achievedQuest.quiz.questions && achievement.quiz && Object.keys(achievement.quiz).length === achievedQuest.quiz.questions.length) ) ) {
                      quests[achievedQuestId].status = stageStatus.STATUS_COMPLETE;
                      if (achievedQuest.quiz) {
                        quests[achievedQuestId].quiz.results = achievement.quiz;
                      }
                  }
                  else {
                    quests[achievedQuestId].status = stageStatus.STATUS_INPROGRESS;
                  }
                }
              };
            }

            for(let questId in quests) {
              let currentQuest = quests[questId];
              if(currentQuest) {
                if(!currentQuest.type) {
                  quests[questId].type = 'website';
                }

                if(currentQuest && !currentQuest.status) {
                  quests[questId].status = stageStatus.STATUS_NEW;
                }

                if(currentQuest.prerequisites) {
                  currentQuest.prerequisites.forEach((prerequisiteId) => {
                    if (typeof prerequisiteId === 'string') {
                      let neededQuests = quests[prerequisiteId]

                      if (neededQuests) {
                        if(Array.isArray(neededQuests.following)) {
                          quests[prerequisiteId].following.push(currentQuest.id);
                        }
                        else {
                          quests[prerequisiteId].following = [currentQuest.id];
                        }
                      }
                      else {
                        console.error(`Innexistant quest ${prerequisiteId} from ${questId}`, currentQuest);
                      }
                    }
                  })
                }
              }
            }

            console.log('Quests & Ages retrieved!', quests, ages, areas, credits);
            callback({ quests, ages, areas, credits });
          }
          else {
            console.error('Error while loading the full quests', quests, ages, areas, credits);
          }
        });
      }
      else {
        console.log('Logging out deleted user');
        storage.sync.set({ activePlayer: -1 }, () => {
          callback();
        });
      }
    };
  });
}

const loadQuests = (journeyId, resolve) => {
  if (journeyId) {
    const questsUrl = `/data/${journeyId}/quests.yaml`;
    const agesUrl = `/data/${journeyId}/ages.yaml`;
    const areasUrl = `/data/${journeyId}/areas.yaml`;
    const creditsUrl = `/data/${journeyId}/credits.yaml`;
    fetch(questsUrl)
      .then((questsResponse) => {
      if (questsResponse.status !== 200) {
        console.error('Error while loading quests:', questsResponse);
        return resolve({ error: questsResponse.status });
      }

      questsResponse.text().then((questsData) => {
        let questsArray = yaml.loadAll(questsData);
        let quests = {};
        for (const quest of questsArray) {
          if (quest) quests[quest.id] = quest;
        }

        fetch(agesUrl)
        .then((agesResponse) => {
          if (agesResponse.status !== 200) {
            console.error('Error while loading ages:', agesResponse);
            return resolve({ error: agesResponse.status });
          }

          agesResponse.text().then((agesData) => {
            let ages = yaml.loadAll(agesData)[0];

            fetch(areasUrl)
            .then((areasResponse) => {
              if (areasResponse.status !== 200) {
                console.error('Error while loading areas:', areasResponse);
                return resolve({ error: areasResponse.status });
              }

              areasResponse.text().then((areasData) => {
                let areas = yaml.loadAll(areasData)[0];

                fetch(creditsUrl)
                .then((creditsResponse) => {
                  if (creditsResponse.status !== 200) {
                    console.error('Error while loading credits:', creditsResponse);
                    return resolve({ error: creditsResponse.status });
                  }

                  creditsResponse.text().then((creditsData) => {
                    let credits = yaml.loadAll(creditsData)[0];

                    storage.local.set({ quests, ages, areas, credits }, () => {
                      console.log('Quests, Ages, Areas & Credits saved!', quests, ages, areas, credits);

                      getFullQuestWithAchievements((fullQuests) => {
                        resolve(fullQuests);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
}

const updatePlayersData = (field, originalAction, reset) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    if (originalAction.payload && originalAction.payload.mock) {
      storage.sync.get(['players', 'activePlayer'], (storageData) => {
        if (storageData && storageData.players && storageData.activePlayer != null) {
          let players = storageData.players;
          let activePlayerId = storageData.activePlayer;
          let activePlayer = players[activePlayerId];

          if (reset) {
            delete activePlayer[field];
          }
          else {
            let value = (field === 'sdg') ? originalAction.payload.sdgNumber : (field === 'onboarded') ? originalAction.payload.onboarded : originalAction.payload.journeyId;
            console.log(`Updating ${activePlayerId}.${field}: ${value}`);
            activePlayer[field] = value;
          }

          if(field === 'journey' && !reset) {
            if (!players[activePlayerId].achievements[originalAction.payload.journeyId]) {
              players[activePlayerId].achievements[originalAction.payload.journeyId] = {
                age: null,
                quests: {},
              }
            }
          }

          storage.sync.set({ players }, () => {
            resolve(players);
          });
        }
        else {
          console.error('Players not found or no played logged in.', storageData);
        }
      });
    }
  }));
}


// =============================================
//            ACTIVE PLAYER
// =============================================

const logIn = (originalAction) => {
  let activePlayer = originalAction.payload.userID;
  return setChromeSyncStorage(originalAction, { activePlayer }, (resolve) => {
    resolve(activePlayer);
  });
};

const logOut = (originalAction) => {
  return setChromeSyncStorage(originalAction, { activePlayer: -1 }, (resolve) => {
    resolve(-1);
  });
};

const getActivePlayer = (originalAction) => {
  return getChromeSyncStorage(originalAction, 'activePlayer',
  (resolve) => {
    resolve(-1);
  });
};

// =============================================
//            PLAYERS
// =============================================

const setNewPlayer = (originalAction) => {
  if (originalAction && originalAction.payload && originalAction.payload.name) {
    let newPlayer = {
      name: originalAction.payload.name,
      onboarded: false,
      achievements: {},
    };

    return middlewarePromise(originalAction, new Promise((resolve, reject) => {
      let players;
      storage.sync.get('players', (storageData) => {
        if (storageData && storageData.players) {
          players = storageData.players;

          let playersKeys = Object.keys(players);
          if (playersKeys.length > 0) {
            let newId = parseInt(playersKeys[playersKeys.length-1]) + 1;
            newPlayer.id = newId.toString();
          }
          else {
            newPlayer.id = "0";
          }

          players[newPlayer.id] = newPlayer;
        }
        else {
          newPlayer.id = "0";
          players = {
            0: newPlayer
          };
        }

        storage.sync.set({ players }, () => {
          resolve(players);
        });
      })
    }));
  }
  else {
    return {
      type: SET_NEW_PLAYER,
      payload: null,
    };
  }
};

const removePlayer = (originalAction) => {
  let playerToBeRemoved = originalAction.payload.id;

  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    let players;
    storage.sync.get('players', (storageData) => {
      if (storageData && storageData.players) {
        players = storageData.players;
        delete players[playerToBeRemoved];

        storage.sync.set({ players }, () => {
          resolve(players);
        });
      }
    })
  }));
};

const setPlayerOnboarding = (originalAction) => {
  return updatePlayersData('onboarded', originalAction);
}

const setActivePlayerSDG = (originalAction) => {
  return updatePlayersData('sdg', originalAction);
}

const setActivePlayerJourney = (originalAction) => {
  return updatePlayersData('journey', originalAction);
}

const resetActivePlayerJourney = (originalAction) => {
  return updatePlayersData('journey', originalAction, true);
}

const getPlayers = (originalAction) => {
  return getChromeSyncStorage(originalAction, 'players', (resolve) => {
    console.error('Error while loading the player list');
    resolve({});
  });
};

const changeAge = (originalAction) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    if (originalAction.payload && originalAction.payload.mock) {
      console.log(`Updating player with age: ${originalAction.payload.newAge}`);

      storage.sync.get(['players', 'activePlayer'], (storageData) => {
        if (storageData && storageData.players && storageData.activePlayer) {
          let players = storageData.players;
          let activePlayerId = storageData.activePlayer;
          let playersJourney = players[activePlayerId].journey;

          if (players[activePlayerId].achievements[playersJourney]
          && (players[activePlayerId].achievements[playersJourney].age >= 0 || typeof players[activePlayerId].achievements[playersJourney].age !== "number") ) {
            console.log("Updating user's age:", originalAction.payload);
            players[activePlayerId].achievements[playersJourney].age = originalAction.payload.newAge;
          }
          else {
            console.error('Can not retrieve proper achievement object', players, activePlayerId, playersJourney);
          }

          storage.sync.set({ players }, () => {
            resolve(players);
          });
        }
        else {
          console.error('Players not found or no player logged in.', storageData);
        }
      });
    }
  }));
}


// =============================================
//            QUESTS
// =============================================

const reloadQuests = (originalAction) => {
  if (originalAction.payload) {
    return middlewarePromise(originalAction, new Promise((resolve, reject) => {
      loadQuests(originalAction.payload.journeyId, resolve);
    }));
  }
  else {
    return originalAction;
  }
};

const resetQuests = (originalAction) => {
  console.log('Resetting Quests, ages & areas data');
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    storage.local.remove(['quests', 'ages', 'areas'], () => {
      resolve({})
    });
  }));
};

const getQuests = (originalAction) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    getFullQuestWithAchievements((fullQuests) => {
      resolve(fullQuests);
    });
  }));
};

const changeQuestProgress = (originalAction) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    if (originalAction.payload && originalAction.payload.mock) {
      console.log(`Updating ${originalAction.payload.activeQuestKey} with achieved stage: ${originalAction.payload.achievedStageNumber} or achieved showcase: ${originalAction.payload.achievedShowcaseNumber} with quiz results: ${originalAction.payload.quizResults}`);

      storage.sync.get(['players', 'activePlayer'], (storageData) => {
        if (storageData && storageData.players && storageData.activePlayer) {
          let players = storageData.players;
          let activePlayerId = storageData.activePlayer;
          let playersJourney = players[activePlayerId].journey;

          if (originalAction.payload.achievedStageNumber === 'none') {
            delete players[activePlayerId].achievements[playersJourney].quests[originalAction.payload.activeQuestKey];
          }
          else {
            if (!players[activePlayerId].achievements[playersJourney].quests[originalAction.payload.activeQuestKey]) {
              players[activePlayerId].achievements[playersJourney].quests[originalAction.payload.activeQuestKey] = {
                stageNumber: null,
                quiz: {},
                showcasesVisited: {},
              }
            }

            if (originalAction.payload.achievedShowcaseNumber !== null && originalAction.payload.achievedShowcaseNumber >= 0) {
              if (!players[activePlayerId].achievements[playersJourney].quests[originalAction.payload.activeQuestKey].showcasesVisited[originalAction.payload.achievedStageNumber]) {
                players[activePlayerId].achievements[playersJourney].quests[originalAction.payload.activeQuestKey].showcasesVisited[originalAction.payload.achievedStageNumber] = {};
              }

              players[activePlayerId].achievements[playersJourney].quests[originalAction.payload.activeQuestKey].showcasesVisited[originalAction.payload.achievedStageNumber][originalAction.payload.achievedShowcaseNumber] = originalAction.payload.quizResults || true;
            }
            else if (originalAction.payload.quizResults) {
              players[activePlayerId].achievements[playersJourney].quests[originalAction.payload.activeQuestKey].quiz = originalAction.payload.quizResults;
            }
            else {
              players[activePlayerId].achievements[playersJourney].quests[originalAction.payload.activeQuestKey].stageNumber = originalAction.payload.achievedStageNumber;
            }
          }

          storage.sync.set({ players }, () => {
            getFullQuestWithAchievements((quests) => {
              resolve(quests);
            })
          });
        }
        else {
          console.error('Players not found or no played logged in.', storageData);
        }
      });
    }
  }));
}


// =============================================
//            TABS (Web replacement)
// =============================================

const getCurrentTab = (originalAction) => {
  return middlewarePromise(originalAction, new Promise((resolve, reject) => {
    // In webapp context, return current window location info
    resolve({
      url: window.location.href,
      id: 0,
    });
  }));
}

export default {
  QUESTS_PULLED: getQuests,
  GET_CURRENT_TAB: getCurrentTab,
  QUESTS_RELOAD: reloadQuests,
  QUESTS_RESET: resetQuests,
  LOG_IN: logIn,
  LOG_OUT: logOut,
  GET_ACTIVE_PLAYER: getActivePlayer,
  SET_NEW_PLAYER: setNewPlayer,
  GET_PLAYERS: getPlayers,
  SET_PLAYER_ONBOARDING: setPlayerOnboarding,
  SET_PLAYER_SDG: setActivePlayerSDG,
  SET_PLAYER_JOURNEY: setActivePlayerJourney,
  RESET_PLAYER_JOURNEY: resetActivePlayerJourney,
  REMOVE_PLAYER: removePlayer,
  STAGE_CHANGE: changeQuestProgress,
  AGE_CHANGE: changeAge
};
