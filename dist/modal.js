/**
 * @accedeweb/modal - WAI-ARIA modal plugin based on AcceDe Web instructions
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

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var callbackEvents = ['hide', 'show'];
  var textualElements = 'h1, h2, h3, h4, h5, h6, p, ul, dl, figure, img, table, canvas, detail';

  var modalIndex = 0;
  var modalCount = 0;

  var Modal = function () {
    _createClass(Modal, null, [{
      key: 'modalCount',
      get: function get() {
        return modalCount;
      },
      set: function set(count) {
        modalCount = count;
      }
    }, {
      key: 'modalIndex',
      get: function get() {
        return modalIndex;
      },
      set: function set(index) {
        modalIndex = index;
      }
    }]);

    function Modal(el, options) {
      _classCallCheck(this, Modal);

      this.listeners = {
        keydown: this._handleKeydown.bind(this),
        click: this._handleClick.bind(this),
        close: this._handleClose.bind(this)
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

      this._init(el);
    }

    /**
     * Register all needed events
     */


    _createClass(Modal, [{
      key: '_bind',
      value: function _bind() {
        var _this = this;

        // listen for keystrokes
        this.el.addEventListener('keydown', this.listeners.keydown, true);
        // listen for clicks
        this.el.addEventListener('click', this.listeners.click);

        // bind click events on every element targeted by the "closeSelector" option
        if (this.el.closeBtns) {
          this.el.closeBtns.forEach(function (button) {
            button.addEventListener('click', _this.listeners.close);
          });
        }
      }

      /**
       * Create modal DOM
       * @returns {HTMLElement} Modal root HTML element
       */

    }, {
      key: '_createDom',
      value: function _createDom() {
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
      }

      /**
       * Disable all focusable DOM elements that do not belong to the modal
       */

    }, {
      key: '_disableDocument',
      value: function _disableDocument() {
        // set the document as disabled
        this.documentDisabled = true;
        inert.set(document.body, this.el);
      }

      /**
       * Enable all focusable DOM elements that do not belong to the modal
       */

    }, {
      key: '_enableDocument',
      value: function _enableDocument() {
        inert.unset(document.body);
        // document is now completely enabled
        this.documentDisabled = false;
      }

      /**
       * Enabling only modal focusable elements
       */

    }, {
      key: '_enableModal',
      value: function _enableModal() {
        inert.unset(this.el);
      }

      /**
       * Find first interactive element that is not a close button
       */

    }, {
      key: '_setInteractiveElement',
      value: function _setInteractiveElement() {
        var _this2 = this;

        // always focus the first element with the "autofocus" attribute
        this.el.firstInteractiveElement = this.el.querySelector('[autofocus]');

        if (this.el.firstInteractiveElement) {
          return;
        }

        var screenHeight = window.innerHeight;

        // search for every focusable element in the modal
        Array.prototype.some.call(this.el.querySelectorAll(inert.focusables), function (el) {
          var closeBtn = void 0;

          if (_this2.el.closeBtns && _this2.el.closeBtns.indexOf(el) > -1) {
            closeBtn = el;
          }

          var height = el.offsetHeight;
          var bottom = el.offsetTop + height;

          // test if focusable element is visible, not below the fold and not a close button
          if (bottom <= screenHeight && (el.offsetWidth || el.offsetHeight) && !closeBtn) {
            _this2.el.firstInteractiveElement = el;

            return true;
          }

          return false;
        });

        if (this.el.firstInteractiveElement) {
          return;
        }

        if (!this.el.firstInteractiveElement && this.el.closeBtns) {
          var firstCloseButton = this.el.closeBtns[0];
          var height = firstCloseButton.offsetHeight;
          var bottom = firstCloseButton.offsetTop + height;

          // fallback on the first close button if not below the fold
          if (bottom <= screenHeight) {
            this.el.firstInteractiveElement = firstCloseButton;

            return;
          }
        }

        // search for every focusable element in the modal
        Array.prototype.some.call(this.el.querySelectorAll(textualElements), function (el) {
          // test if focusable element is visible and not a close button
          if (el.offsetWidth || el.offsetHeight) {
            el.setAttribute('tabindex', '-1');

            _this2.el.firstInteractiveElement = el;

            return true;
          }

          return false;
        });
      }

      /**
       * Set focus on modal first interactive element
       */

    }, {
      key: '_focus',
      value: function _focus() {
        var _this3 = this;

        // search for the first focusable element
        if (!this.el.firstInteractiveElement) {
          this._setInteractiveElement();
        }

        // focus the first focusable element
        window.requestAnimationFrame(function () {
          _this3.el.firstInteractiveElement.focus();
        });
      }

      /**
       * Handle click behaviours
       * @param {Object} e `click` DOM event
       */

    }, {
      key: '_handleClick',
      value: function _handleClick(event) {
        // don't close if the click doesn't come from the modal itself
        // or if we don't want to close it when clicking outside of the modal's content
        if (this.options.closeOnCancel === false || event.target !== this.el) {
          return;
        }

        this._handleClose(event, 'cancel');
      }
      /**
       * Handle modal close behaviour
       * @param {Object} e DOM event object or object with a type property.
       * @param {string} returnValue Close action
       */

    }, {
      key: '_handleClose',
      value: function _handleClose(event, returnValue) {
        // don't close on cancel if role is 'alertdialog'
        if (this.options.role === 'alertdialog' && returnValue === 'cancel') {
          return;
        }

        // remove all event listeners
        this._unbind();
        this._trigger('hide', returnValue);
        this.el.setAttribute('aria-hidden', 'true');

        if (this.options.modal && Modal.modalCount === 1) {
          // enable focusable elements
          this._enableDocument();
        }

        // update the modalCount
        Modal.modalCount--;
        // focus the button that was used to open the modal or fallback on the body
        this.options.opener.focus();
      }
      /**
       * Handle keyboard behaviours
       * @param {Object} e `keydown` DOM event
       */

    }, {
      key: '_handleKeydown',
      value: function _handleKeydown(event) {
        // close the modal on escape press if its not a dialog tag
        if (event.keyCode === 27 && this.options.closeOnCancel !== false) {
          this._handleClose(event, 'cancel');

          return true;
        }

        return false;
      }
      /**
       * Hide modal behaviour
       */

    }, {
      key: 'hide',
      value: function hide() {
        this._handleClose({
          type: 'user'
        });
      }
      /**
       * Init modal
       * @param {innerHTML} el Complete modal DOM element
       * @returns {Object} Modal instance
       */

    }, {
      key: '_init',
      value: function _init(el) {
        // update the modalCount
        Modal.modalIndex++;
        // when passing a DOM element
        if (el) {
          this.el = this._initDom(el);
        }
        // create the root element for the modal
        else {
            this.el = this._createDom();
          }

        this.el.modal = this;

        // store all close buttons of the modal
        if (this.options.closeSelector) {
          this.el.closeBtns = Array.prototype.slice.call(this.el.querySelectorAll(this.options.closeSelector));

          if (!this.el.closeBtns.length) {
            delete this.el.closeBtns;
          }
        }

        // check if all necessary aria roles and attributes are present
        if (this.options.role) {
          this._validateModal();
        }

        // force the modal to be a child of body
        if (this.el.parentNode !== document.body) {
          document.body.appendChild(this.el);
        }

        return this;
      }
      /**
       * Init given modal DOM
       * @param {innerHTML} el Complete modal DOM element
       * @returns {HTMLElement} Modal root element
       */

    }, {
      key: '_initDom',
      value: function _initDom(el) {
        this.options.role = el.getAttribute('role');

        if (this.options.modal) {
          el.setAttribute('aria-modal', 'true');
        }

        return el;
      }
      /**
       * Handle removing modal handlers
       * @param {string} event Event name. Can be `hide`, `show`
       * @param {function} callback Callback function
       */

    }, {
      key: 'off',
      value: function off(event, callback) {
        if (!this.callbacks[event]) {
          return;
        }

        var callbackIndex = this.callbacks[event].indexOf(callback);

        if (callbackIndex < 0) {
          return;
        }

        this.callbacks[event].splice(callbackIndex, 1);
      }
      /**
       * Handle adding modal handlers
       * @param {string} event Event name. Can be `hide`, `show`
       * @param {function} callback Callback function
       */

    }, {
      key: 'on',
      value: function on(event, callback) {
        if (callbackEvents.indexOf(event) < 0) {
          return;
        }

        if (!this.callbacks[event]) {
          this.callbacks[event] = [];
        }

        this.callbacks[event].push(callback);
      }
      /**
       * Show modal behaviour
       */

    }, {
      key: 'show',
      value: function show() {
        Modal.modalCount++;
        // bind eventListeners to the modal
        this._bind();
        // store the current focused element before focusing the modal
        this.options.opener = this.options.opener || document.activeElement;
        // IE can't focus a svg element
        if (this.options.opener.nodeName === 'svg') {
          this.options.opener = this.options.opener.parentNode;
        }

        this._trigger('show');

        if (this.el.getAttribute('aria-hidden') !== 'false') {
          // display the modal
          this.el.setAttribute('aria-hidden', 'false');
        }

        this._focus();

        // disable any focusable element not in the modal
        if (Modal.modalCount === 1 && this.options.modal && !this.documentDisabled) {
          this._disableDocument();
        }
        // in case we're passing a dom element check if it's focusable elements have not been "disabled"
        else if (this.documentDisabled && this.options.dom) {
            this._enableModal();
          }
      }
      /**
       * Trigger callback associated to passed event
       * @param {string} eventName Event name. Can be `hide`, `show`.
       */

    }, {
      key: '_trigger',
      value: function _trigger(eventName, params) {
        var _this4 = this;

        if (!this.callbacks[eventName]) {
          return;
        }

        this.callbacks[eventName].forEach(function (callback) {
          callback(_this4, params);
        });
      }
      /**
       * Remove all modal event bindings
       */

    }, {
      key: '_unbind',
      value: function _unbind() {
        var _this5 = this;

        // remove listeners
        this.el.removeEventListener('keydown', this.listeners.keydown, true);
        this.el.removeEventListener('click', this.listeners.click);

        // remove close button listeners
        if (this.el.closeBtns) {
          this.el.closeBtns.forEach(function (button) {
            button.removeEventListener('click', _this5.listeners.close);
          });
        }
      }
      /**
       * Validate modal a11y features and outputs an error if a11y is compromised
       */

    }, {
      key: '_validateModal',
      value: function _validateModal() {
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
      }
    }]);

    return Modal;
  }();

  return Modal;

})));
