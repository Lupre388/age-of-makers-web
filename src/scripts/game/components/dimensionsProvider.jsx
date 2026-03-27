/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react';
import { useResizeDetector } from 'react-resize-detector';

function DimensionsProvider({ children }) {
  const { width, height, ref } = useResizeDetector();

  return (
    <div ref={ref}>
      {children({
        containerWidth: width || 0,
        containerHeight: height || 0,
      })}
    </div>
  );
}

export default DimensionsProvider;
