/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Component} from 'react';
import Markdown from 'react-markdown';
import {connect} from 'react-redux';
import { isLoggedInAndLoaded, getActivePlayerData } from '../../_utils';
import CustomMessage from './customMessage';
import BandlabPlayer from './bandlabPlayer';
import Countdown from './countdown';
import Quiz from './quiz';

class MarkdownRenderer extends Component {
  constructor(props) {
    super(props);
  }

  returnMdComponents() {
    return {
      code: ({ className, children }) => {
        // Extract language from className (e.g. "language-warning" → "warning")
        const language = className ? className.replace('language-', '') : '';
        const value = String(children).replace(/\n$/, '');

        if (language === 'warning' || language === 'info') {
          return <CustomMessage type={language}>
            { value }
          </CustomMessage>
        }

        if (language === 'bandlab') {
          return <BandlabPlayer musicId={value} />
        }

        if (language === 'youtube') {
          return <iframe
            className="youtubeVideo embedded"
            src={`https://www.youtube.com/embed/${value}`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        }

        if (language === 'countdown') {
          try {
            let params = JSON.parse(value);

            if (params && params.minutes) {
              return <Countdown minutes={params.minutes} prompts={params.prompts} />
            }
          } catch (e) {
            console.error('Error', e);
            return <p>Error rendering the countdown.</p>
          }
        }

        if (language === 'dynamicLinkFromQuestQuiz') {
          try {
            let params = JSON.parse(value);
            if (params && isLoggedInAndLoaded(this.props)) {
              if (params.questionId && this.props.journey.quests[params.questId]) {
                return <p className="text-center">
                  <a href={this.props.journey.quests[params.questId].quiz.results[params.questionId]} target={params.target} className="btn btn-success dynamicLink">{params.label}</a>
                </p>
              }
              else {
                return <p>Error loading the dynamic link.</p>
              }
            }
          } catch (e) {
            console.error('Error', e);
            return <p>Error rendering the dynamic link.</p>
          }
        }

        if (language === 'quizResults') {
          try {
            let params = JSON.parse(value);

            if (params && params.questionId && this.props.journey.quests[params.questId]) {
              return this.props.journey.quests[params.questId].quiz.results[params.questionId];
            }
            else if (params && params.questId && this.props.journey.quests[params.questId]) {
              if (params.stageOrder >= 0 && this.props.journey.quests[params.questId].stages && this.props.journey.quests[params.questId].stages[params.stageOrder] && this.props.journey.quests[params.questId].stages[params.stageOrder].showcaseItems) {
                return <div className="row">
                  { this.props.journey.quests[params.questId].stages[params.stageOrder].showcaseItems.map((showcaseItem) => {
                    if (showcaseItem.results) {
                      return <div className="col-4">
                        <h6><strong>{ showcaseItem.name } by { showcaseItem.artist }</strong></h6>
                        <Quiz quizData={this.props.journey.quests[params.questId].stages[params.stageOrder].quiz} quizResults={showcaseItem.results} inline={true}/>
                      </div>
                    }
                  }) }
                </div>
              }
              else if (this.props.journey.quests[params.questId] && this.props.journey.quests[params.questId].quiz) {
                return <Quiz quizData={this.props.journey.quests[params.questId].quiz}  />
              }
              else {
                console.log('Error while loading quiz markdown', params);
              }
            }
          } catch (e) {
            console.error('Error', e);
            return <p>Error rendering the quiz results.</p>
          }
        }

        // Default code snippet
        return <pre><code className={className}>{value}</code></pre>
      },
      a: ({ href, children }) => {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
        );
      },
      img: ({ src, alt }) => {
        return (
          <img
            alt={alt}
            src={src}
          />
        );
      }
    }
  }

  render() {
    return <Markdown
      components={ this.returnMdComponents() }
    >{this.props.mdContent}</Markdown>;
  }
}

const mapStateToProps = (state) => {
  return {
    journey: state.journey,
    players: state.players,
    activePlayer: state.activePlayer,
    activePlayerData: getActivePlayerData(state),
  };
};

export default connect(mapStateToProps)(MarkdownRenderer);
