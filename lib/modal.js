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


  // list of form elements that will not trigger a close when the escape key is pressed
  var formElements = [ 'INPUT', 'TEXTAREA', 'SELECT' ];
  var focusables = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contentEditable]';

  var dialog = document.createElement( 'dialog' );
  var hasDialogInterface = 'showModal' in dialog;


  /**
   * Modal constructor
   * @constructor
   * @param {Node} elm - DOM node
   */
  var Modal = function( options ){
    var modal,
        closeBtns = [],
        inertedElements = [];

    this.bind = function bind(){
      this.listeners = {
        keydown: this.handleKey.bind( this ),
        focusin: this.handleFocusIn.bind( this ),
        closeBtn: this.close.bind( this )
      };

      modal.addEventListener( 'keydown', this.listeners.keydown, true );
      document.body.addEventListener( 'focus', this.listeners.focusin, true );

      if( options.closeSelector ){
        Array.prototype.forEach.call( modal.querySelectorAll( options.closeSelector ), function( btn ){
          btn.addEventListener( 'click', this.listeners.closeBtn );
          closeBtns.push( btn );
        }.bind( this ) );
      }
    };

    this.close = function(){

      // remove listeners
      modal.removeEventListener( 'keydown', this.listeners.keydown, true );
      document.body.removeEventListener( 'focus', this.listeners.focusin, true );

      // remove close listeners
      if( closeBtns ){
        closeBtns.forEach( function( btn ){
          btn.removeEventListener( 'click', this.listeners.closeBtn );
        }.bind( this ) );
        // empty array of close buttons
        closeBtns.length = 0;
      }

      // make focusable elements outside the modal focusable again
      this.wakeDom();

      // focus back the opener
      options.opener.focus();


      if( options.onClose ){
        options.onClose();
      }
    };

    this.handleKey = function( e ){
      switch( e.keyCode ){
        case 27:
          if( formElements.indexOf( e.target.nodeName ) === -1 ){
            this.close();
          }
          break;
      }
    };

    this.handleFocusIn = function( e ){
      if( modal.contains( e.target ) ){
        return;
      }

      modal.focus();
    };

    this.inertDom = function(){
      var tabindex;

      Array.prototype.forEach.call( document.querySelectorAll( focusables ), function( el ){
        if( modal.contains( el ) ){
          return;
        }

        inertedElements.push( el );

        tabindex = el.getAttribute( 'tabindex' );

        if( tabindex ){

          el.defaultTabindex = tabindex;
          // filter
          if( tabindex.trim().slice(0,1) === '-' ){
            return;
          }

        }

        el.setAttribute( 'tabindex', '-1' );

      } );
    };

    /**
     * Kickstart Modal instance
     */
    this.init = function init(){

      if ( !options || !options.dom && !options.html ) {
        throw new Error( 'No DOM node nor html string provided. Abort.' );
      }

      if( !options.opener ){
        throw new Error( 'Opener is mandatory to bring the focus back on modal\'s close' );
      }

      this.data = {};

      modal = document.createElement( options.tagName || 'div' );

      modal.setAttribute( 'aria-hidden', 'true' );

      if( options.role ) {
        modal.setAttribute( 'role', options.role );
      }
      else{
        modal.setAttribute( 'tabindex', '-1' );
      }

      if( options.className ){
        modal.setAttribute( 'class', options.className );
      }

      if( options.dom ){
        modal.appendChild( options.dom );
      }
      else{
        modal.innerHTML = options.html;
      }

    };

    /**
     * Dummy function
     */
    this.noop = function(){};

    this.show = function( wrapper ){

      this.bind();

      this.inertDom();

      options.wrapper = wrapper;

      modal.setAttribute( 'aria-hidden', 'false' );

      wrapper.appendChild( modal );
      modal.focus();
    };

    this.wakeDom = function(){

      inertedElements.forEach( function( el ){
        if( modal.contains( el ) ){
          return;
        }

        if( !el.defaultTabindex ){
          el.removeAttribute( 'tabindex' );
          return;
        }

        el.setAttribute( 'tabindex', el.defaultTabindex );
        delete el.defaultTabindex;

      } );

      // clear the array of previously inerted elements
      inertedElements.length = 0;
    };

    // init Modal instance
    this.init();

    // expose what user might need
    return {
      el: modal,
      close: this.close.bind( this ),
      show: this.show.bind( this )
    };
  };

  // Export our constructor
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
