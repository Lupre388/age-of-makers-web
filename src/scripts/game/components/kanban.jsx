/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Component} from 'react';
import {connect} from 'react-redux';
import { bindActionCreators } from 'redux';
import { getActiveQuestData } from '../../_utils';

function Board({ initialBoard }) {
  if (!initialBoard || !initialBoard.columns) return null;

  return (
    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '8px' }}>
      {initialBoard.columns.map((column, colIdx) => (
        <div key={column.id || colIdx} style={{
          minWidth: '250px',
          flex: '1',
          background: '#f4f5f7',
          borderRadius: '8px',
          padding: '12px',
        }}>
          <h5 style={{ margin: '0 0 12px', fontWeight: 'bold' }}>{column.title}</h5>
          {(column.cards || []).map((card, cardIdx) => (
            <div key={card.id || cardIdx} style={{
              background: 'white',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}>
              <strong>{card.title}</strong>
              {card.description && <p style={{ margin: '4px 0 0', fontSize: '0.9em', color: '#666' }}>{card.description}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

class Kanban extends Component {
  constructor(props) {
      super(props);
      this.state = {}
  }

  renderKanban() {
    if (this.props.activeQuestData.boards) {
      return <Board initialBoard={{ columns: this.props.activeQuestData.boards }} />
    }
    else {
      console.error('No boards to show on the kanban.');
    }
  }

  render() {
    if (this.props.embeddedPage && this.props.activeQuestData) {
      return <div className="row">
          <div className="row">
            <div className="col-sm-10 col-sm-offset-1">
              <h1>{this.props.activeQuestData.name}</h1>
              <h4>Explaination here.</h4>
            </div>
          </div>
          <div className="row">
            { this.renderKanban() }
          </div>
      </div>
    }
    else {
      return <div>Loading</div>
    }
  }
}

const mapStateToProps = (state) => {
  return {
    embeddedPage: state.embeddedPage,
    activeQuest: state.activeQuest,
    activeQuestData: getActiveQuestData(state),
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Kanban);
