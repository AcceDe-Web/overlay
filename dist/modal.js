(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Modal = factory());
}(this, (function () { 'use strict';

/**
 * Methods to disable or enable interactive elements from a context element
 */

var focusables = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contentEditable]';

/**
 * disable the focusable elements located in the context
 * @param {HTMLElement} context - the element where to look for focusable elements
 */
function set() {
  var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.body;
  var activeElement = arguments[1];

  // if context already has disabled elements dont set inert
  if (context.disabledElements) {
    return;
  }

  var disabledElements = [];
  var hiddenElements = [];

  // loop over all focusable element in the dom to set their "tabindex" to -1 if >= 0
  Array.prototype.forEach.call(context.querySelectorAll(focusables), function (el) {
    // skip focusable element contained in the activeElement
    if (activeElement && activeElement.contains(el) || el.closest('[hidden]')) {
      return;
    }

    var tabindex = parseInt(el.getAttribute('tabindex'), 10);

    if (tabindex) {
      // don't change the tabindex if it is < 0
      if (tabindex < 0) {
        return;
      }

      // store previous setted tabindex
      el.defaultTabindex = tabindex;
    }

    // store the focusable element so we can loop on it later
    disabledElements.push(el);

    // "disable" the element
    el.setAttribute('tabindex', '-1');
  });

  // store "disabled" elements to loop on it later
  context.disabledElements = disabledElements.length ? disabledElements : null;

  if (activeElement) {
    Array.prototype.forEach.call(activeElement.parentNode.children, function (el) {
      if (el.nodeName === 'SCRIPT' || el === activeElement) {
        return;
      }

      var hidden = el.getAttribute('aria-hidden');

      if (hidden) {
        if (hidden === 'true') {
          return;
        }

        el.defaultAriaHidden = hidden;
      }

      el.setAttribute('aria-hidden', 'true');
      // el.setAttribute( 'inert', true );

      hiddenElements.push(el);
    });
  } else {
    context.setAttribute('aria-hidden', 'true');

    hiddenElements.push(context);
  }

  context.hiddenElements = hiddenElements.length ? hiddenElements : null;
}

function unset() {
  var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.body;

  var disabledElements = context.disabledElements || Array.from(context.querySelectorAll(focusables));
  var hiddenElements = context.hiddenElements || [context];

  disabledElements.forEach(function (el) {
    var defaultTabindex = el.defaultTabindex;

    if (!defaultTabindex) {
      el.removeAttribute('tabindex');
      return;
    }

    // set the tabindex to its previous value
    el.setAttribute('tabindex', defaultTabindex);
    el.defaultTabindex = null;
  });

  context.disabledElements = null;

  hiddenElements.forEach(function (el) {
    var defaultAriaHidden = el.defaultAriaHidden;

    if (!defaultAriaHidden) {
      el.removeAttribute('aria-hidden');
      return;
    }

    // set the tabindex to its previous value
    el.setAttribute('aria-hidden', defaultAriaHidden);
    el.defaultAriaHidden = null;
  });

  context.hiddenElements = null;
}

var inert = { set: set, unset: unset, focusables: focusables };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * Modal module
 * @module Modal
 * @param {Object} window - Browser window object
 * @param {Object} document - Browser document object
 * @param {string} exportName - Module export name. Constructor reference will be accessible on window[exportName].
 */
var callbackEvents = ['hide', 'show'];

/**
 * Modal Constructor
 * @constructor
 * @param {HTMLElement} el - Modal main container
 * @param {Object} options Options object to configure the modal
 * @property {string} [options.className] HTML classes to add to the modal root element. Optional
 * @property {string} [options.closeSelector] CSS-like selector for all elements that trigger the modal close behaviour. Optional
 * @property {(HTMLElement|string)} [options.dom] DOM tree to be appended into the modal. Optional
 * @property {string} [options.label] Modal `aria-label`. Optional
 * @property {boolean} [options.modal=true] should the layer be modal
 * @property {HTMLElement} [options.opener] HTML Element that triggered the modal opening. Optional
 * @property {string} [options.role] Defines `role` attribute. Can be `dialog` or `alertdialog`.
 *  Optional
 * @property {string} [options.tagName] HTML tag to use as modal root element. Optional
 */
var Modal = function Modal(el, options) {
  this.listeners = {
    keydown: this.handleKeydown.bind(this),
    click: this.handleClick.bind(this),
    close: this.handleClose.bind(this)
  };

  this.callbacks = {};

  if (options.modal !== false) {
    options.modal = true;
  }

  this.init(el, options);
};

// store a counter of modals in case we need to dynamicaly create id's
Modal.modalIndex = 0;

/**
 * Register all needed events
 */
Modal.prototype.bind = function () {
  var _this = this;

  // listen for keystrokes
  this.el.addEventListener('keydown', this.listeners.keydown, true);

  // listen for clicks
  this.el.addEventListener('click', this.listeners.click);

  // bind click events on every element targeted by the "closeSelector" option
  this.el.closeBtns.forEach(function (button) {
    button.addEventListener('click', _this.listeners.close);
  });
};

/**
 * Create modal DOM
 * @param {Object} options Options object to configure the modal
 * @property {string} [options.className] HTML classes to add to the modal root element. Optional
 * @property {string} [options.closeSelector] CSS-like selector for all elements that trigger the
 *  modal close behaviour. Optional
 * @property {(HTMLElement|string)} [options.dom] DOM tree to be appended into the modal. Optional
 * @property {string} [options.label] Modal `aria-label`. Optional
 * * @property {boolean} [options.modal=true] should the layer be modal
 * @property {HTMLElement} [options.opener] HTML Element that triggered the modal opening. Optional
 * @property {string} [options.role] Defines `role` attribute. Can be `dialog` or `alertdialog`.
 *  Optional
 * @property {string} [options.tagName] HTML tag to use as modal root element. Optional
 * @returns {HTMLElement} Modal root HTML element
 */
Modal.prototype.createDom = function (options) {
  // create a modal root element
  var el = document.createElement(options.tagName || 'div');

  // add user's classes
  if (options.className) {
    el.className += options.className;
  }

  el.setAttribute('aria-hidden', 'true');

  if (options.modal !== false) {
    el.setAttribute('aria-modal', 'true');
  }

  // put content into the modal
  if (options.dom) {
    if (typeof options.dom === 'string') {
      el.innerHTML = options.dom;
    } else {
      el.appendChild(options.dom);
    }
  }

  // set the label
  if (options.label) {
    el.setAttribute('aria-label', options.label);
  }

  // look for a label and a description inside the modal
  if (options.role) {
    el.setAttribute('role', options.role);

    var modalNumber = Modal.modalIndex;

    // always provide a label when modal has a role
    if (!options.label && !el.hasAttribute('aria-labelledby') && !el.hasAttribute('aria-label')) {
      var title = el.querySelector(options.titleSelector || '[data-label]');
      var titleId = void 0;

      if (title) {
        titleId = title.id || 'modalTitle' + modalNumber;
        title.id = titleId;

        el.setAttribute('aria-labelledby', titleId);
      }
    }

    // look for a description
    if (!el.hasAttribute('aria-describedby')) {
      var description = el.querySelector('[data-description]');
      var descriptionId = void 0;

      if (description) {
        descriptionId = description.id || 'modalDescription' + modalNumber;
        description.id = descriptionId;

        el.setAttribute('aria-describedby', descriptionId);
      }
    }
  }

  // store the modal's options on the modal
  el.options = options;

  return el;
};

/**
 * Disable all focusable DOM elements that do not belong to the modal
 */
Modal.prototype.disableDocument = function () {
  // set the document as disabled
  this.documentDisabled = true;
  inert.set(document.body, this.el);
};

/**
 * Enable all focusable DOM elements that do not belong to the modal
 */
Modal.prototype.enableDocument = function () {
  inert.unset(document.body);

  // document is now completely enabled
  this.documentDisabled = false;
};

/**
 * Enabling only modal focusable elements
 */
Modal.prototype.enableModal = function () {
  inert.unset(this.el);
};

/**
 * Find first interactive element that is not a close button
 */
Modal.prototype.findInteractiveElement = function () {
  var _this2 = this;

  // always focus the first element with the "autofocus" attribute
  this.el.firstInteractiveElement = this.el.querySelector('[autofocus]');

  if (this.el.firstInteractiveElement) {
    return;
  }

  // search for every focusable element in the modal
  Array.prototype.some.call(this.el.querySelectorAll(inert.focusables), function (el) {
    var closeBtn = void 0;

    if (_this2.el.closeBtns && _this2.el.closeBtns.indexOf(el) > -1) {
      closeBtn = el;
    }

    // test if focusable element is visible and not a close button
    if ((el.offsetWidth || el.offsetHeight) && !closeBtn) {
      _this2.el.firstInteractiveElement = el;
      return true;
    }

    return false;
  });

  if (!this.el.firstInteractiveElement && this.el.closeBtns) {
    // fallback on the first close button
    this.el.firstInteractiveElement = this.el.closeBtns[0];
  }
};

/**
 * Set focus on modal first interactive element
 */
Modal.prototype.focus = function () {
  var _this3 = this;

  // search for the first focusable element
  if (!this.el.firstInteractiveElement) {
    this.findInteractiveElement();
  }

  // focus the first focusable element
  window.requestAnimationFrame(function () {
    _this3.el.firstInteractiveElement.focus();
  });
};

/**
 * Handle click behaviours
 * @param {object} e `click` DOM event
 */
Modal.prototype.handleClick = function (e) {
  // don't close if the click doesn't come from the modal itself
  // or if we don't want to close it when clicking outside of the modal's content
  if (this.el.options.outerClose === false || e.target !== this.el) {
    return;
  }

  this.handleClose(e, 'cancel');
};

/**
 * Handle modal close behaviour
 * @param {object} e DOM event object or object with a type property.
 * @param {string} result Close action
 */
Modal.prototype.handleClose = function (e, returnValue) {
  // don't close on cancel if role is 'alertdialog'
  if (this.el.options.role === 'alertdialog' && returnValue === 'cancel') {
    return;
  }

  // remove all event listeners
  this.unbind();

  this.trigger('hide');

  this.el.setAttribute('aria-hidden', 'true');

  if (this.el.options.modal !== false) {
    // enable focusable elements
    this.enableDocument();
  }

  // focus the button that was used to open the modal or fallback on the body
  this.el.options.opener.focus();
};

/**
 * Handle keyboard behaviours
 * @param {object} e `keydown` DOM event
 */
Modal.prototype.handleKeydown = function (e) {
  // close the modal on escape press if its not a dialog tag
  if (e.keyCode === 27) {
    this.handleClose(e, 'cancel');
    return true;
  }

  return false;
};

/**
 * Hide modal behaviour
 */
Modal.prototype.hide = function () {
  this.handleClose({
    type: 'user'
  });
};

/**
 * Init modal
 * @param {innerHTML} el Complete modal DOM element
 * @param {Object} options Options object to configure the modal
 * @property {string} [options.className] HTML classes to add to the modal root element. Optional
 * @property {string} [options.closeSelector] CSS-like selector for all elements that trigger the
 *  modal close behaviour. Optional
 * @property {(HTMLElement|string)} [options.dom] DOM tree to be appended into the modal. Optional
 * @property {string} [options.label] Modal `aria-label`. Optional
 * @property {HTMLElement} [options.opener] HTML Element that triggered the modal opening. Optional
 * @property {string} [options.role] Defines `role` attribute. Can be `dialog` or `alertdialog`.
 *  Optional
 * @property {string} [options.tagName] HTML tag to use as modal root element. Optional
 * @returns {object} Modal instance
 */
Modal.prototype.init = function (el, options) {
  // update the modalCount
  Modal.modalIndex++;

  // test is passed element has already been processed by the modals
  if (!el.options) {
    // when passing a DOM element
    if (el.nodeType === 1) {
      this.el = this.initDom(el, options);
    }
    // create the root element for the modal
    else if ((typeof el === 'undefined' ? 'undefined' : _typeof(el)) === 'object') {
        this.el = this.createDom(el);
      } else {
        throw new Error('No parameter passed.');
      }

    // store all close buttons of the modal
    this.el.closeBtns = Array.from(this.el.querySelectorAll(this.el.options.closeSelector));

    if (!this.el.closeBtns.length) {
      throw new Error('You must provide a valid selector with the key `closeSelector`. A modal must have a close button');
    }

    // check if all necessary aria roles and attributes are present
    if (this.el.options.role) {
      this.validateModal();
    }
  } else {
    this.el = el;
  }

  // force the modal to be a child of body
  if (this.el.parentNode !== document.body) {
    document.body.appendChild(this.el);
  }

  return this;
};

/**
 * Init given modal DOM
 * @param {innerHTML} el Complete modal DOM element
 * @param {Object} options Options object to configure the modal
 * @property {string} [options.className] HTML classes to add to the modal root element. Optional
 * @property {string} [options.closeSelector] CSS-like selector for all elements that trigger the modal close behaviour. Optional
 * @property {(HTMLElement|string)} [options.dom] DOM tree to be appended into the modal. Optional
 * @property {string} [options.label] Modal `aria-label`. Optional
 * @property {boolean} [options.modal] Modal `aria-label`. Optional
 * @property {HTMLElement} [options.opener] HTML Element that triggered the modal opening. Optional
 * @property {string} [options.role] Defines `role` attribute. Can be `dialog` or `alertdialog`. Optional
 * @property {string} [options.tagName] HTML tag to use as modal root element. Optional
 * @returns {object} Modal root element
 */
Modal.prototype.initDom = function (el, options) {
  // store options
  el.options = options || {};

  el.options.role = el.getAttribute('role');

  if (el.options.modal) {
    el.setAttribute('aria-modal', 'true');
  }

  return el;
};

/**
 * Handle removing modal handlers
 * @param {string} event Event name. Can be `hide`, `show`
 * @param {function} callback Callback function
 */
Modal.prototype.off = function (event, callback) {
  if (!this.callbacks[event]) {
    return;
  }

  var callbackIndex = this.callbacks[event].indexOf(callback);

  if (callbackIndex < 0) {
    return;
  }

  this.callbacks[event].splice(callbackIndex, 1);
};

/**
 * Handle adding modal handlers
 * @param {string} event Event name. Can be `hide`, `show`
 * @param {function} callback Callback function
 */
Modal.prototype.on = function (event, callback) {
  if (callbackEvents.indexOf(event) < 0) {
    return;
  }

  if (!this.callbacks[event]) {
    this.callbacks[event] = [];
  }

  this.callbacks[event].push(callback);
};

/**
 * Show modal behaviour
 */
Modal.prototype.show = function () {
  // bind eventListeners to the modal
  this.bind();

  // store the current focused element before focusing the modal
  this.el.options.opener = this.el.options.opener || document.activeElement;

  this.trigger('show');

  if (this.el.getAttribute('aria-hidden') !== 'false') {
    // display the modal
    this.el.setAttribute('aria-hidden', 'false');
  }

  this.focus();

  // disable any focusable element not in the modal
  if (this.el.options.modal !== false && !this.documentDisabled) {
    this.disableDocument();
  }
  // in case we're passing a dom element check if it's focusable elements have not been "disabled"
  else if (this.documentDisabled && this.el.options.dom) {
      this.enableModal();
    }
};

/**
 * Trigger callback associated to passed event
 * @param {string} event Event name. Can be `hide`, `show`.
 */
Modal.prototype.trigger = function (event) {
  var _this4 = this;

  if (!this.callbacks[event]) {
    return;
  }

  this.callbacks[event].forEach(function (callback) {
    callback(_this4);
  });
};

/**
 * Remove all modal event bindings
 */
Modal.prototype.unbind = function () {
  var _this5 = this;

  // remove listeners
  this.el.removeEventListener('keydown', this.listeners.keydown, true);
  this.el.removeEventListener('click', this.listeners.click);

  // remove close button listeners
  this.el.closeBtns.forEach(function (button) {
    button.removeEventListener('click', _this5.listeners.close);
  });
};

/**
 * Validate modal a11y features and outputs an error if a11y is compromised
 */
Modal.prototype.validateModal = function () {
  var label = this.el.getAttribute('aria-label');
  var description = this.el.getAttribute('aria-describedby');
  var modalTitle = void 0;

  if (!label || label && label.trim().length < 0) {
    modalTitle = this.el.querySelector('#' + this.el.getAttribute('aria-labelledby'));

    if (!modalTitle || !this.el.contains(modalTitle)) {
      throw new Error('No title is present in the modal. Use the "data-label" attribute on the visible title or pass the label using the "label" key when showing the modal.');
    }
  }

  if (this.el.options.role === 'alertdialog' && !description) {
    throw new Error('"alertdialog" modal needs a description, use the "data-description" attribute on the text content of the modal to validate the modal.');
  }
};

return Modal;

})));
