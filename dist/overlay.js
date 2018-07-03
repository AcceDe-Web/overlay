/**
 * @accedeweb/overlay - WAI-ARIA overlay plugin based on AcceDe Web instructions
 * @version v0.0.0
 * @link http://a11y.switch.paris/
 * @license ISC
 **/

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Overlay = factory());
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

  var textualElements = 'h1, h2, h3, h4, h5, h6, p, ul, dl, figure, img, table, canvas, detail';

  var layerIndex = 0;
  var layerStack = [];

  var cancelListener = function cancelListener(event) {
    if (!layerStack.length || event.keyCode !== 27) {
      return;
    }

    var topModal = layerStack[0].layer;

    topModal._dispatchEvent('cancel');
  };

  var Overlay = function () {
    _createClass(Overlay, [{
      key: 'addEventListener',
      value: function addEventListener() {
        this.el.addEventListener.apply(this.el, arguments);
      }
    }, {
      key: 'returnValue',
      get: function get() {
        return this.el.returnValue;
      },
      set: function set(value) {
        if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
          this.el.returnValue = JSON.stringify(value);

          return;
        }

        this.el.returnValue = value.toString();
      }
    }], [{
      key: 'layerIndex',
      get: function get() {
        return layerIndex;
      },
      set: function set(index) {
        layerIndex = index;
      }
    }, {
      key: 'stack',
      get: function get() {
        return layerStack.slice();
      }
    }]);

    function Overlay(el, options) {
      _classCallCheck(this, Overlay);

      this._handleCancel = this._handleCancel.bind(this);
      this._handleClick = this._handleClick.bind(this);
      this._handleClose = this._handleClose.bind(this);

      this.callbacks = {};

      options = arguments[1] || (_typeof(arguments[0]) === 'object' ? arguments[0] : {});
      el = options !== arguments[0] ? arguments[0] : undefined;

      // if element is a string, convert it to a DOM element
      if (typeof el === 'string') {
        var wrapper = document.createElement('div');

        wrapper.innerHTML = el;

        el = wrapper.firstChild;
      }

      if (!el && !options) {
        throw new Error('No parameter passed.');
      }

      if (options.modal === undefined) {
        options.modal = true;
      }

      if (!options.closeOnCancel) {
        options.closeOnCancel = true;
      }

      this.options = options;

      this._init(el);
    }

    /**
     * Register all needed events
     */


    _createClass(Overlay, [{
      key: '_bind',
      value: function _bind() {
        var _this = this;

        // listen for clicks
        this.el.addEventListener('click', this._handleClick);

        // listen for cancel
        this.el.addEventListener('cancel', this._handleCancel);

        // bind click events on every element targeted by the "closeSelector" option
        if (this.el.closeBtns) {
          this.el.closeBtns.forEach(function (button) {
            button.addEventListener('click', _this._handleClose);
          });
        }
      }

      /**
       * Create layer DOM
       * @returns {HTMLElement} Modal root HTML element
       */

    }, {
      key: '_createDom',
      value: function _createDom() {
        // create a layer root element
        var el = document.createElement(this.options.tagName || 'div');

        // add user's classes
        if (this.options.className) {
          el.className += this.options.className;
        }

        el.setAttribute('aria-hidden', 'true');

        if (this.options.modal) {
          el.setAttribute('aria-modal', 'true');
        }

        // put content into the layer
        if (this.options.content) {
          if (typeof this.options.content === 'string') {
            el.innerHTML = this.options.content;
          } else {
            el.appendChild(this.options.content);
          }
        }

        // set the label
        if (this.options.label) {
          el.setAttribute('aria-label', this.options.label);
        }

        // look for a label and a description inside the layer
        if (this.options.role) {
          el.setAttribute('role', this.options.role);
          var layerNumber = Overlay.layerIndex;

          // always provide a label when layer has a role
          if (!this.options.label && !el.hasAttribute('aria-labelledby') && !el.hasAttribute('aria-label')) {
            var title = el.querySelector(this.options.titleSelector || '[data-label]');
            var titleId = void 0;

            if (title) {
              titleId = title.id || 'layerTitle' + layerNumber;
              title.id = titleId;
              el.setAttribute('aria-labelledby', titleId);
            }
          }

          // look for a description
          if (!el.hasAttribute('aria-describedby')) {
            var description = el.querySelector('[data-description]');
            var descriptionId = void 0;

            if (description) {
              descriptionId = description.id || 'layerDescription' + layerNumber;
              description.id = descriptionId;
              el.setAttribute('aria-describedby', descriptionId);
            }
          }
        }

        return el;
      }

      /**
       * Disable all focusable DOM elements that do not belong to the layer
       */

    }, {
      key: '_disableDocument',
      value: function _disableDocument() {
        // set the document as disabled
        this.documentDisabled = true;
        inert.set(document.body, this.el);
      }
    }, {
      key: '_dispatchEvent',
      value: function _dispatchEvent(eventName) {
        var eventParams = {
          cancelable: eventName === 'cancel'
        };

        var event = new window.CustomEvent(eventName, eventParams);

        this.el.dispatchEvent(event);
      }

      /**
       * Enable all focusable DOM elements that do not belong to the layer
       */

    }, {
      key: '_enableDocument',
      value: function _enableDocument() {
        inert.unset(document.body);
        // document is now completely enabled
        this.documentDisabled = false;
      }

      /**
       * Enabling only layer focusable elements
       */

    }, {
      key: '_enableLayer',
      value: function _enableLayer() {
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

        // search for every focusable element in the layer
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

        // search for every focusable element in the layer
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
       * Set focus on layer first interactive element
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
    }, {
      key: '_handleCancel',
      value: function _handleCancel(event) {
        if (event.defaultPrevented || this.options.role === 'alertdialog') {
          return;
        }

        this._handleClose(event);
      }

      /**
       * Handle click behaviours
       * @param {MouseEvent} event `click` DOM event
       */

    }, {
      key: '_handleClick',
      value: function _handleClick(event) {
        // don't close if the click doesn't come from the layer itself
        // or if we don't want to close it when clicking outside of the layer's content
        if (this.options.closeOnCancel === false || event.target !== this.el) {
          return;
        }

        // don't close when clicking outside an alertdialog
        if (event.target === this.el && this.options.role === 'alertdialog') {
          return;
        }

        this._dispatchEvent('cancel');
      }
      /**
       * Handle layer close behaviour
       * @param {Object} event DOM event object or object with a type property.
       */

    }, {
      key: '_handleClose',
      value: function _handleClose() {

        // remove all event listeners
        this._unbind();
        this._dispatchEvent('close');
        this.el.setAttribute('aria-hidden', 'true');

        if (this.options.modal && layerStack.length === 1) {
          // enable focusable elements
          this._enableDocument();
        }

        // update the layer stack
        layerStack.splice(layerStack.indexOf(this.el), 1);

        // focus the button that was used to open the layer or fallback on the body
        this.options.opener.focus();
      }

      /**
       * Close layer behaviour
       * @param {string} returnValue the value the layer will return
       */

    }, {
      key: 'close',
      value: function close(returnValue) {

        if (returnValue) {
          this.el.returnValue = returnValue;
        }

        this._handleClose();
      }
      /**
       * Init layer
       * @param {HTMLElement} el Complete layer DOM element
       * @returns {Object} Modal instance
       */

    }, {
      key: '_init',
      value: function _init(el) {
        // update the layer index
        Overlay.layerIndex++;
        // when passing a DOM element
        if (el) {
          this.el = this._initDom(el);
        }
        // create the root element for the layer
        else {
            this.el = this._createDom();
          }

        this.el.layer = this;

        // init the return value to an empty string
        this.el.returnValue = '';

        // add the close method to the root element
        this.el.close = this.close;

        // store all close buttons of the layer
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

        // force the layer to be a child of body
        if (this.el.parentNode !== document.body) {
          document.body.appendChild(this.el);
        }

        return this;
      }
      /**
       * Init given layer DOM
       * @param {HTMLElement} el Complete layer DOM element
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
    }, {
      key: 'removeEventListener',
      value: function removeEventListener() {
        this.el.removeEventListener.apply(this.el, arguments);
      }
      /**
       * Show layer behaviour
       */

    }, {
      key: 'show',
      value: function show() {
        // add the new layer at the top of the stack
        layerStack.unshift(this.el);

        // set the default returnValue of the layer
        this.returnValue = '';

        // bind eventListeners to the layer
        this._bind();
        // store the current focused element before focusing the layer
        this.options.opener = this.options.opener || document.activeElement;
        // IE can't focus a svg element
        if (this.options.opener.nodeName === 'svg') {
          this.options.opener = this.options.opener.parentNode;
        }

        if (this.el.getAttribute('aria-hidden') !== 'false') {
          // display the layer
          this.el.setAttribute('aria-hidden', 'false');
        }

        this._focus();

        // disable any focusable element not in the layer
        if (layerStack.length === 1 && this.options.modal && !this.documentDisabled) {
          this._disableDocument();
        }
        // in case we're passing a dom element check if it's focusable elements have not been "disabled"
        else if (this.documentDisabled && this.options.content) {
            this._enableLayer();
          }
      }
      /**
       * Remove all layer event bindings
       */

    }, {
      key: '_unbind',
      value: function _unbind() {
        var _this4 = this;

        // remove listeners
        this.el.removeEventListener('click', this._handleClick);
        this.el.removeEventListener('click', this._handleCancel);

        // remove close button listeners
        if (this.el.closeBtns) {
          this.el.closeBtns.forEach(function (button) {
            button.removeEventListener('click', _this4._handleClose);
          });
        }
      }
      /**
       * Validate layer a11y features and outputs an error if a11y is compromised
       */

    }, {
      key: '_validateModal',
      value: function _validateModal() {
        var label = this.el.getAttribute('aria-label');
        var description = this.el.getAttribute('aria-describedby');
        var layerTitle = void 0;

        if (!label || label && label.trim().length < 0) {
          layerTitle = this.el.querySelector('#' + this.el.getAttribute('aria-labelledby'));
          if (!layerTitle || !this.el.contains(layerTitle)) {
            throw new Error('No title is present in the layer. Use the "data-label" attribute on the visible title or pass the label using the "label" key when creating the layer.');
          }
        }

        if (this.options.role === 'alertdialog' && !description) {
          throw new Error('"alertdialog" layer needs a description, use the "data-description" attribute on the text content of the layer to validate the layer.');
        }
      }
    }]);

    return Overlay;
  }();

  // listen to the escape key to close the top-most layer


  document.body.addEventListener('keydown', cancelListener);

  return Overlay;

})));
