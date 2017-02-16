/* global define, module */

/**
 * Modal module
 * @module Modal
 * @param {Object} window - Browser window object
 * @param {Object} document - Browser document object
 * @param {string} exportName - Module export name. Constructor reference will be accessible on window[exportName].
 */
(function(window, document, exportName) {
  'use strict';

  var focusables = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contentEditable]',
      callbackEvents = [ 'close' ];

  var Modal = function( el, options ){

    this.listeners = {
      keydown: this.handleKeydown.bind( this ),
      click: this.handleClick.bind( this ),
      close: this.handleClose.bind( this )
    };

    this.callbacks = {};

    this.init( el, options );
  };

  // store a counter of modals in case we need to dynamicaly create id's
  Modal.modalIndex = 0;

  Modal.prototype.bind = function(){

    // listen for keystrokes
    this.el.addEventListener( 'keydown', this.listeners.keydown, true );

    // listen for clicks
    this.el.addEventListener( 'click', this.listeners.click );

    // bind click events on every element targeted by the "closeSelector" option
    this.el.closeBtns.forEach( function( btn ){
      btn.addEventListener( 'click', this.listeners.close );
    }.bind( this ) );

  };

  Modal.prototype.close = function(){
    this.handleClose( {type: 'user'} );
  };

  Modal.prototype.createDom = function( options ){
    // create a modal root element
    var el = document.createElement( options.tagName || 'div' );

    // add user's classes
    if( options.className ){
      el.className += options.className;
    }

    if( options.role ){
      el.setAttribute( 'role', options.role );
    }
    // allow the modal to be focusable when there's no role provided
    else{
      el.setAttribute( 'tabindex', '-1' );
    }

    el.setAttribute( 'aria-hidden', 'true' );

    el.setAttribute( 'aria-modal', 'true' );

    // put content into the modal

    if( options.dom ){
      el.appendChild( options.dom );
      options.dom = true;
    }
    else{
      el.innerHTML = options.html;
      delete options.html;
    }

    // set the label
    if( options.label ){
      el.setAttribute( 'aria-label', options.label );
    }
    // look for a label and a description inside the modal
    else if( options.role ){
      var modalNumber = Modal.modalIndex,
          title = el.querySelector( '[data-label]' ),
          titleId,
          description = el.querySelector( '[data-description]' ),
          descriptionId;

      if( title ){
        titleId = title.id || 'modalTitle' + modalNumber;
        title.id = titleId;

        el.setAttribute( 'aria-labelledby', titleId );
      }

      if( description ){
        descriptionId = description.id || 'modalDescription' + modalNumber;
        description.id = descriptionId;

        el.setAttribute( 'aria-describedby', descriptionId );
      }
    }

    // store the modal's options on the modal
    el.options = options;

    return el;

  };

  Modal.prototype.disableDocument = function(){
    // console.time( 'disableDocument' );
    // set the document as disabled
    this.documentDisabled = true;

    var tabindex,
        hidden,
        disabledElement = [],
        hiddenElements = [];

    // loop over all focusable element in the dom to set their "tabindex" to -1 if >= 0
    Array.prototype.forEach.call( document.querySelectorAll( focusables ), function( el ){

      // skip focusable element contained in the modal
      if( this.el.contains( el ) ){
        return;
      }

      tabindex = el.getAttribute( 'tabindex' );

      if( tabindex ){
        // don't change the tabindex if it is < 0
        if( tabindex.trim().slice(0,1) === '-' ){
          return;
        }

        // store previous setted tabindex
        el.defaultTabindex = tabindex;
      }

      // store the focusable element so we can loop on it later
      disabledElement.push( el );

      // "disable" the element
      el.setAttribute( 'tabindex', '-1' );

    }.bind( this ) );

    // store "disabled" elements to loop on it later
    this.disabledElement = disabledElement;
    // console.timeEnd( 'disableDocument' );

    Array.prototype.forEach.call( this.el.parentNode.children, function( el ){

      if( 'SCRIPT' === el.nodeName || el === this.el ){
        return;
      }

      hidden = el.getAttribute( 'aria-hidden' );

      if( hidden ){

        if( 'true' === hidden ){
          return;
        }

        el.defaultAriaHidden = hidden;


      }

      hiddenElements.push( el );

      el.setAttribute( 'aria-hidden', 'true' );
      el.setAttribute( 'inert', true );

    }.bind( this ) );

    this.hiddenElements = hiddenElements;
  };

  Modal.prototype.enableDocument = function(){
    // loop over previously "disabled" elements
    this.disabledElement.forEach( function( el ){

      this.enableElement( el );

    }.bind( this ) );

    // clear the disabled element list
    this.disabledElement.length = 0;

    this.hiddenElements.forEach( function( el ){
      this.showElement( el );
    }.bind( this ) );

    this.hiddenElements.length = 0;

    // document is now completely enabled
    this.documentDisabled = false;
  };

  Modal.prototype.enableElement = function( el ){
    // remove current tabindex if there was none before opening the modal
    if( !el.defaultTabindex ){
      el.removeAttribute( 'tabindex' );
      return;
    }

    // set the tabindex to its previous value
    el.setAttribute( 'tabindex', el.defaultTabindex );
    delete el.defaultTabindex;
  };

  Modal.prototype.enableModal = function(){
    // temporary array of focusable element that are not in the modal
    var leftDisabled = [];

    this.disabledElement.forEach( function( el ){

      if( !this.el.contains( el ) ){
        leftDisabled.push( el );
        return;
      }

      this.enableElement( el );

    }.bind( this ) );

    // update the array of disabled elements
    this.disabledElement = leftDisabled;
  };

  Modal.prototype.findInteractiveElement = function(){
    var firstCloseBtn;

    // always focus the first element with the "autofocus" attribute
    this.el.firstInteractiveElement = this.el.querySelector( '[autofocus]' );

    if( this.el.firstInteractiveElement ){
      return;
    }

    // search for every focusable element in the modal
    Array.prototype.some.call( this.el.querySelectorAll( focusables ), function( el ){
      var closeBtn;
      if( this.el.closeBtns && this.el.closeBtns.indexOf( el ) > -1 ){
        closeBtn = el;
        if( !firstCloseBtn ){
          firstCloseBtn = closeBtn;
        }
      }

      // test if focusable element is visible and not a close button
      if( ( el.offsetWidth || el.offsetHeight ) && !closeBtn ){
        this.el.firstInteractiveElement = el;
        return true;
      }
    }.bind( this ) );

    if( !this.el.firstInteractiveElement ){
      // fallback on the first close button
      this.el.firstInteractiveElement = firstCloseBtn ;
    }
  };

  Modal.prototype.focus = function(){

    // search for the first focusable element
    if( !this.el.firstInteractiveElement ){
      this.findInteractiveElement();
    }

    // focus the first focusable element
    this.el.firstInteractiveElement.focus();
  };

  Modal.prototype.handleClick = function( e ){

    // don't close if the click doesn't come from the modal itself
    // or if we don't want to close it when clicking outside of the modal's content
    if( this.el.options.outerClose === false || e.target !== this.el ){
      return;
    }

    this.handleClose( e, 'cancel' );
  };

  Modal.prototype.handleClose = function( e, result ){

    // don't close on cancel if role is 'alertdialog'
    if( 'alertdialog' === this.el.options.role && 'cancel' === result ){
      return;
    }

    // remove all eventListeners
    this.unbind();

    this.trigger( 'close' );

    this.el.setAttribute( 'aria-hidden', 'true' );

    // enable focusable elements
    this.enableDocument();

    // focus the button that was used to open the modal or fallback on the body
    ( this.el.options.opener || document.body ).focus();

  };

  Modal.prototype.handleKeydown = function( e ){
    // close the modal on escape press if its not a dialog tag
    if( 27 === e.keyCode ){
      this.handleClose( e, 'cancel' );
      return;
    }
  };

  Modal.prototype.initDom = function( el, options ){
    // store options
    el.options = options || {};

    // add a tabindex -1 when the modal has no role and is not a dialog
    if( !el.hasAttribute( 'role' ) ){
      el.setAttribute( 'tabindex', '-1' );
    }

    el.setAttribute( 'aria-modal', 'true' );

    return el;
  };

  Modal.prototype.init = function( el, options ){

    // update the modalCount
    Modal.modalIndex++;

    // test is passed element has already been processed by the modals
    if( !el.options ){
      // when passing a DOM element
      if( el.nodeType === 1 ){
        this.el = this.initDom( el, options );
      }
      // create the root element for the modal
      else if( typeof( el ) === 'object' ){
        this.el = this.createDom( el );
      }
      else{
        throw new Error( 'No parameter passed.' );
      }

      // store all close buttons of the modal
      this.el.closeBtns = Array.prototype.slice.call( this.el.querySelectorAll( this.el.options.closeSelector ) );

      if( !this.el.closeBtns.length ){
        throw new Error( 'You must provide a valid selector with the key `closeSelector`. A modal must have a close button' );
      }

      if( this.el.options.role ){
        this.validateModal();
      }

      // this.el.options.hiddenClass = ' ' + ( this.el.options.hiddenClass || 'modal-hidden' );

      // this.el.className += this.el.options.hiddenClass;

    }
    else{
      this.el = el;
    }

    // force the modal to be a child of body
    if( this.el.parentNode !== document.body ){
      document.body.appendChild( this.el );
    }

    return this;

  };

  Modal.prototype.off = function( event, callback ) {
    if( this.callbacks[ event ] ){
      return;
    }

    var callbackIndex = this.callbacks[ event ].indexOf( callback );

    if( callbackIndex < 0 ){
      return;
    }

    this.callbacks[ event ].splice( callbackIndex, 1 );

  };

  Modal.prototype.on = function( event, callback ){
    if( callbackEvents.indexOf( event ) < 0 ){
      return;
    }

    if( !this.callbacks[ event ] ){
      this.callbacks[ event ] = [];
    }

    this.callbacks[ event ].push( callback );

  };

  Modal.prototype.show = function(){

    // bind eventListeners to the modal
    this.bind();

    // store the current focused element before focusing the modal
    this.el.options.opener = this.el.options.opener || document.activeElement;

    if( this.el.getAttribute( 'aria-hidden' ) !== 'false' ){
      // display the modal
      this.el.setAttribute( 'aria-hidden', 'false' );
    }

    this.focus();

    // disable any focusable element not in the modal if
    if( !this.documentDisabled && !this.el.options.isDialog ){
      this.disableDocument();
    }
    // in case we're passing a dom element check if it's focusable elements have not been "disabled"
    else if( this.documentDisabled && this.el.options.dom ){
      this.enableModal();
    }

  };

  Modal.prototype.showElement = function( el ){
    el.removeAttribute( 'inert' );

    // remove current tabindex if there was none before opening the modal
    if( !el.defaultAriaHidden ){
      el.removeAttribute( 'aria-hidden' );
      return;
    }

    // set the tabindex to its previous value
    el.setAttribute( 'aria-hidden', el.defaultAriaHidden );
    delete el.defaultAriaHidden;
  };

  Modal.prototype.trigger = function( event ){
    if( !this.callbacks[ event ] ){
      return;
    }

    this.callbacks[ event ].forEach( function( callback ){
      callback();
    } );
  };

  Modal.prototype.unbind = function(){

    // remove listeners
    this.el.removeEventListener( 'keydown', this.listeners.keydown, true );

    this.el.removeEventListener( 'click', this.listeners.click );

    // remove close button listeners
    this.el.closeBtns.forEach( function( btn ){
      btn.removeEventListener( 'click', this.listeners.close );
    }.bind( this ) );
  };

  Modal.prototype.validateModal = function(){
    var label = this.el.getAttribute( 'aria-label' ),
        description = this.el.getAttribute( 'aria-describedby' ),
        modalTitle;

    if( !label || ( label && label.trim().length < 0 ) ){
      modalTitle = this.el.querySelector( '#'+this.el.getAttribute( 'aria-labelledby' ) );

      if( !modalTitle || !this.el.contains( modalTitle ) ){
        throw new Error( 'No title is present in the modal. Use the "data-label" attribute on the visible title or pass the label using the "label" key when showing the modal.' );
      }
    }

    if( 'alertdialog' === this.el.options.role && !description ){
      throw new Error( '"alertdialog" modal needs a description, use the "data-description" attribute on the text content of the modal to validate the modal.' );
    }

  };

  // Export
  if (typeof define === 'function' && define.amd) {
    define(function() {
      return Modal;
    });
  }

  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
  }

  else {
    window[exportName] = Modal;
  }

})(window, document, 'Modal');
