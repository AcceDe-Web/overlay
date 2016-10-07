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

  var defaultsOptions = {

  },
  focusables = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contentEditable=true]',
  hasDialog = 'showModal' in document.createElement( 'dialog' ),
  raf = window.requestAnimationFrame || function( callback ){
    return window.setTimeout( callback, 16 );
  };

  var Modal = {

    bind: function( modal ){

      if( modal.options.isDialog ){
        modal.addEventListener( 'cancel', this.listeners.close );
      }
      else{
        modal.addEventListener( 'keydown', this.listeners.keydown, true );
      }

      if( modal.options.closeSelector ){

        modal.closeBtns = [];

        Array.prototype.forEach.call( modal.querySelectorAll( modal.options.closeSelector ), function( btn ){
          btn.addEventListener( 'click', this.listeners.close );
          modal.closeBtns.push( btn );
        }.bind( this ) );
      }

    },

    createDom: function( options ){
      options.isDialog = options.role && hasDialog;

      var el = document.createElement( options.isDialog ? 'dialog' : options.tagName || 'div' );

      if( options.className ){
        el.className += options.className;
      }

      if( options.role ){
        if( !hasDialog || ( hasDialog && options.role !== 'dialog' ) ){
          el.setAttribute( 'role', options.role );
        }
      }
      else{
        el.setAttribute( 'tabindex', '-1' );
      }

      if( options.dom ){
        el.appendChild( options.dom );
        delete options.dom;
      }
      else{
        el.innerHTML = options.html;
        delete options.html;
      }

      el.options = options;

      return el;

    },

    display: function( modal ){

      modal.options.hiddenClass = ' ' + ( modal.options.hiddenClass || 'modal-hidden' );

      // modal.style.display = 'none';

      modal.className += modal.options.hiddenClass;

      if( !document.body.contains( modal ) ){
        document.body.appendChild( modal );
      }

      if( modal.options.isDialog ){
        modal.showModal();
      }
      else{
        this.focus( modal );
      }

      // modal.style.display = '';

      raf( function(){
        modal.className = modal.className.replace( modal.options.hiddenClass, '' );
      } );

    },

    findInteractiveElement: function( modal ){

      modal.firstInteractiveElement = modal.querySelector( '[autofocus]' );

      if( modal.firstInteractiveElement ){
        return;
      }

      Array.prototype.some.call( modal.querySelectorAll( focusables ), function( el ){
        // test if focusable element is visible and not a close button
        if( ( el.offsetWidth || el.offsetHeight ) && ( modal.closeBtns && modal.closeBtns.indexOf( el ) === -1 ) ){
          modal.firstInteractiveElement = el;
          return true;
        }
      } );
    },

    focus: function( modal ){
      if( modal.hasAttribute( 'tabindex' ) ){
        modal.focus();
        return;
      }

      if( !modal.firstInteractiveElement ){
        this.findInteractiveElement( modal );
      }

      modal.firstInteractiveElement.focus();
    },

    handleClose: function( e ){

      var modal = this.modalStack[0];

      console.log( 'handleClose', e.type, modal );

      if( 'cancel' === e.type ){
        e.preventDefault();
      }

      this.unbind( modal );

      modal.className += modal.options.hiddenClass;

      window.setTimeout( function(){


        if( modal.options.isDialog ){
          modal.close();
        }

        modal.parentNode.removeChild( modal );

        modal.className = modal.className.replace( modal.options.hiddenClass, '' );

        this.modalStack.splice( this.modalStack.indexOf( modal ), 1 );

        // if there's another modal opened focus it back
        if( !modal.options.isDialog && this.modalStack[0] ){
          this.focus( this.modalStack[0] );
        }
        // focus the button that was used to open the modal or fallback on the body
        else{
          ( modal.options.opener || document.body ).focus();
        }

      }.bind( this ), 300 );



    },

    handleKeydown: function( e ){
      if( 27 === e.keyCode ){

        console.log( 'handleKeydown', e.type, this.modalStack[0] );

        this.handleClose( e );
      }
    },

    modalStack: [],

    show: function( el, options ){
      var modal;

      if( !this.listeners ){
        this.listeners = {
          keydown: this.handleKeydown.bind( this ),
          close: this.handleClose.bind( this )
        };
      }

      if( !el.options ){
        if( el.nodeName === 'DIALOG' ){
          modal = el;
          modal.options = options || {};
          modal.options.isDialog = true;
        }
        else if( typeof( el ) === 'object' ){
          modal = this.createDom( el );
        }
        else{
          throw new Error( 'Only a dialog tag is accepted as default parameter' );
        }
      }
      else{
        modal = el;
      }

      this.modalStack.splice( 0, 0, modal );

      this.bind( modal );

      this.display( modal );

      return modal;

    },

    unbind: function( modal ){

      // remove listeners
      if( modal.options.isDialog ){
        modal.removeEventListener( 'cancel', this.listeners.close );
      }
      else{
        modal.removeEventListener( 'keydown', this.listeners.keydown, true );
      }

      // remove close listeners
      if( modal.closeBtns ){
        modal.closeBtns.forEach( function( btn ){
          btn.removeEventListener( 'click', this.listeners.close );
        }.bind( this ) );
        // remove button refs
        delete modal.closeBtns;
      }
    }
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
