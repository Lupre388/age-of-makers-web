// Patched version of element-resize-event that works in ESM strict mode
// Original uses `this` in IIFE which is `undefined` in ESM
var _window = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : {};

var requestFrame = (function () {
  var raf = _window.requestAnimationFrame ||
    _window.mozRequestAnimationFrame ||
    _window.webkitRequestAnimationFrame ||
    function fallbackRAF(func) {
      return _window.setTimeout(func, 20)
    }
  return function requestFrameFunction(func) {
    return raf(func)
  }
})()

var cancelFrame = (function () {
  var cancel = _window.cancelAnimationFrame ||
    _window.mozCancelAnimationFrame ||
    _window.webkitCancelAnimationFrame ||
    _window.clearTimeout
  return function cancelFrameFunction(id) {
    return cancel(id)
  }
})()

function resizeListener(e) {
  var win = e.target || e.srcElement
  if (win.__resizeRAF__) cancelFrame(win.__resizeRAF__)
  win.__resizeRAF__ = requestFrame(function () {
    var trigger = win.__resizeTrigger__
    if (trigger) {
      trigger.__resizeListeners__.forEach(function (fn) {
        fn.call(trigger, e)
      })
    }
  })
}

var exports = module.exports = function (element, fn) {
  var document = _window.document
  var isIE

  function objectLoad() {
    this.contentDocument.defaultView.__resizeTrigger__ = this.__resizeElement__
    this.contentDocument.defaultView.addEventListener('resize', resizeListener)
  }

  if (!element.__resizeListeners__) {
    element.__resizeListeners__ = []
    if (element.attachEvent) {
      element.__resizeTrigger__ = element
      element.attachEvent('onresize', resizeListener)
    } else {
      if (getComputedStyle(element).position === 'static') element.style.position = 'relative'
      var obj = element.__resizeTrigger__ = document.createElement('object')
      obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;')
      obj.setAttribute('class', 'resize-sensor')
      obj.__resizeElement__ = element
      obj.onload = objectLoad
      obj.type = 'text/html'
      isIE = navigator.userAgent.match(/Trident/)
      if (isIE) element.appendChild(obj)
      obj.data = 'about:blank'
      if (!isIE) element.appendChild(obj)
    }
  }
  element.__resizeListeners__.push(fn)
}

exports.unbind = function (element, fn) {
  element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1)
  if (!element.__resizeListeners__.length) {
    if (element.detachEvent) element.detachEvent('onresize', resizeListener)
    else {
      element.__resizeTrigger__.contentDocument.defaultView.removeEventListener('resize', resizeListener)
      delete element.__resizeTrigger__
    }
  }
}
