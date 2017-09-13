/**
 * accedeweb-modal - WAI-ARIA modal plugin based on AcceDe Web instructions
 * @version v0.0.0
 * @link http://a11y.switch.paris/
 * @license ISC
 **/

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

    var disabledElements = context.disabledElements || Array.prototype.slice.call(context.querySelectorAll(focusables));
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

  var callbackEvents = ['hide', 'show'];

  /**
   * Modal Constructor
   * @constructor
   * @param {HTMLElement|Object} el Modal main container or the option object
   * @param {Object} options Options object to configure the modal
   * @param {string} [options.className] HTML classes to add to the modal root element
   * @param {boolean} [options.closeOnCancel=true] Close the modal on escape key and click outside the content
   * @param {string} options.closeSelector CSS-like selector for all elements that trigger the modal close behaviour
   * @param {HTMLElement|string} options.dom DOM tree to be appended into the modal
   * @param {string} [options.label] Set the modal's `aria-label` attribute
   * @param {boolean} [options.modal=true] Set if the modal has a modal behaviour
   * @param {HTMLElement} [options.opener] HTML Element that triggered the modal opening
   * @param {string} [options.role] Set the `role` attribute. Can be `dialog` or `alertdialog`
   * @param {string} [options.tagName] HTML tag to use as modal root element
   * @returns {createdModal} modal object
   */
  var Modal = function Modal(el, options) {
    this.listeners = {
      keydown: this.handleKeydown.bind(this),
      click: this.handleClick.bind(this),
      close: this.handleClose.bind(this)
    };

    this.callbacks = {};

    options = arguments[1] || _typeof(arguments[0]) === 'object' ? arguments[0] : {};
    el = options !== arguments[0] ? arguments[0] : undefined;

    if (!el && !options) {
      throw new Error('No parameter passed.');
    }

    if (!options.modal) {
      options.modal = true;
    }

    this.options = options;

    this.init(el);
    /**
     * Modal returned object
     * @typedef {Object} createdModal
     * @property {HTMLElement} el The modal root HTML element
     * @property {function} hide Close the modal - triggers a `hide` event
     * @property {function} off Stop listening to the `show` or `hide` events
     * @property {function} on Start listening to the `show` or `hide` events
     * @property {object} options The modal's options
     * @property {function} show display the modal - triggers a `show` event
    **/
    return {
      el: this.el,
      options: this.options,
      show: this.show.bind(this),
      hide: this.hide.bind(this),
      on: this.on.bind(this),
      off: this.off.bind(this)
    };
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
   * @returns {HTMLElement} Modal root HTML element
   */
  Modal.prototype.createDom = function () {
    // create a modal root element
    var el = document.createElement(this.options.tagName || 'div');

    // add user's classes
    if (this.options.className) {
      el.className += this.options.className;
    }

    el.setAttribute('aria-hidden', 'true');

    if (this.options.modal) {
      el.setAttribute('aria-modal', 'true');
    }

    // put content into the modal
    if (this.options.dom) {
      if (typeof this.options.dom === 'string') {
        el.innerHTML = this.options.dom;
      } else {
        el.appendChild(this.options.dom);
      }
    }

    // set the label
    if (this.options.label) {
      el.setAttribute('aria-label', this.options.label);
    }

    // look for a label and a description inside the modal
    if (this.options.role) {
      el.setAttribute('role', this.options.role);

      var modalNumber = Modal.modalIndex;

      // always provide a label when modal has a role
      if (!this.options.label && !el.hasAttribute('aria-labelledby') && !el.hasAttribute('aria-label')) {
        var title = el.querySelector(this.options.titleSelector || '[data-label]');
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
   * @param {Object} e `click` DOM event
   */
  Modal.prototype.handleClick = function (e) {
    // don't close if the click doesn't come from the modal itself
    // or if we don't want to close it when clicking outside of the modal's content
    if (this.options.closeOnCancel === false || e.target !== this.el) {
      return;
    }

    this.handleClose(e, 'cancel');
  };

  /**
   * Handle modal close behaviour
   * @param {Object} e DOM event object or object with a type property.
   * @param {string} returnValue Close action
   */
  Modal.prototype.handleClose = function (e, returnValue) {
    // don't close on cancel if role is 'alertdialog'
    if (this.options.role === 'alertdialog' && returnValue === 'cancel') {
      return;
    }

    // remove all event listeners
    this.unbind();

    this.trigger('hide');

    this.el.setAttribute('aria-hidden', 'true');

    if (this.options.modal) {
      // enable focusable elements
      this.enableDocument();
    }

    // focus the button that was used to open the modal or fallback on the body
    this.options.opener.focus();
  };

  /**
   * Handle keyboard behaviours
   * @param {Object} e `keydown` DOM event
   */
  Modal.prototype.handleKeydown = function (e) {
    // close the modal on escape press if its not a dialog tag
    if (e.keyCode === 27 && this.options.closeOnCancel !== false) {
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
   * @returns {Object} Modal instance
   */
  Modal.prototype.init = function (el) {
    // update the modalCount
    Modal.modalIndex++;

    // when passing a DOM element
    if (el) {
      this.el = this.initDom(el);
    }
    // create the root element for the modal
    else {
        this.el = this.createDom();
      }

    // store all close buttons of the modal
    this.el.closeBtns = Array.prototype.slice.call(this.el.querySelectorAll(this.options.closeSelector));

    if (!this.el.closeBtns.length) {
      throw new Error('You must provide a valid selector with the key `closeSelector`. A modal must have a close button');
    }

    // check if all necessary aria roles and attributes are present
    if (this.options.role) {
      this.validateModal();
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
   * @returns {HTMLElement} Modal root element
   */
  Modal.prototype.initDom = function (el) {

    this.options.role = el.getAttribute('role');

    if (this.options.modal) {
      this.setAttribute('aria-modal', 'true');
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
    this.options.opener = this.options.opener || document.activeElement;

    this.trigger('show');

    if (this.el.getAttribute('aria-hidden') !== 'false') {
      // display the modal
      this.el.setAttribute('aria-hidden', 'false');
    }

    this.focus();

    // disable any focusable element not in the modal
    if (this.options.modal && !this.documentDisabled) {
      this.disableDocument();
    }
    // in case we're passing a dom element check if it's focusable elements have not been "disabled"
    else if (this.documentDisabled && this.options.dom) {
        this.enableModal();
      }
  };

  /**
   * Trigger callback associated to passed event
   * @param {string} eventName Event name. Can be `hide`, `show`.
   */
  Modal.prototype.trigger = function (eventName) {
    var _this4 = this;

    if (!this.callbacks[eventName]) {
      return;
    }

    this.callbacks[eventName].forEach(function (callback) {
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

    if (this.options.role === 'alertdialog' && !description) {
      throw new Error('"alertdialog" modal needs a description, use the "data-description" attribute on the text content of the modal to validate the modal.');
    }
  };

  return Modal;

})));
