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

  /**
   * Modal constructor
   * @constructor
   * @param {Node} elm - DOM node
   */
  var Modal = function( options ){

    this.bind = function bind(){
      this.listeners = {
        keydown: this.handleKey.bind( this ),
        focusin: this.handleFocusIn.bind( this )
      };

      this.el.addEventListener( 'keydown', this.listeners.keydown, true );
      document.body.addEventListener( 'focusin', this.listeners.focusin, true );
    };

    this.close = function(){

      this.el.removeEventListener( 'keydown', this.listeners.keydown, true );
      document.body.removeEventListener( 'focusin', this.listeners.focusin, true );

      // focus back the opener
      options.opener.focus();


      if( options.onClose ){
        options.onClose();
      }
    };

    this.handleKey = function( e ){
      switch( e.keyCode ){
        case 27:
          if( this.data.formElements.indexOf( e.target.nodeName ) === -1 ){
            this.close();
          }
      }
    };

    this.handleFocusIn = function( e ){
      console.log( e.type, this );
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

      this.data = {
        formElements: [ 'INPUT', 'TEXTAREA', 'SELECT' ]
      };

      this.el = document.createElement( options.tagName || 'div' );

      this.el.setAttribute( 'tabindex', '-1' );
      this.el.setAttribute( 'aria-hidden', 'true' );

      if( options.role ) {
        this.el.setAttribute( 'role', options.role );
      }

      if( options.className ){
        this.el.setAttribute( 'class', options.className );
      }

      if( options.dom ){
        this.el.appendChild( options.dom.cloneNode( true ) );
      }
      else{
        this.el.innerHTML = options.html;
      }

    };

    /**
     * Dummy function
     */
    this.noop = function(){};

    this.show = function( wrapper ){

      this.bind();

      options.wrapper = wrapper;

      this.el.setAttribute( 'aria-hidden', 'false' );

      wrapper.appendChild( this.el );
      this.el.focus();
    };

    // init Modal instance
    this.init();

    // expose what user might need
    return {
      el: this.el,
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
