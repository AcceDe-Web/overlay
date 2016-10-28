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

  var focusables = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contentEditable=true]',
  hasDialog = 'showModal' in document.createElement( 'dialog' ),
  raf = window.requestAnimationFrame || function( callback ){
    return window.setTimeout( callback, 16 );
  };

  var Modal = {

    bind: function( modal ){

      // cancel event is fired when pressing the escape key on a dialog
      if( modal.options.isDialog ){
        modal.addEventListener( 'cancel', this.listeners.close );
      }
      // listen for keystrokes
      modal.addEventListener( 'keydown', this.listeners.keydown, true );

      // listen for clicks
      modal.addEventListener( 'click', this.listeners.click );

      // bind click events on every element targeted by the "closeSelector" option
      modal.closeBtns.forEach( function( btn ){
        btn.addEventListener( 'click', this.listeners.close );
      }.bind( this ) );

    },

    createDom: function( options ){
      options.isDialog = options.role && hasDialog;

      // create a dialog element if browser has the DOM interface and a role is passed to the options
      // fallback to user defined tagname or a div otherwise
      var el = document.createElement( options.isDialog ? 'dialog' : options.tagName || 'div' );

      // add user's classes
      if( options.className ){
        el.className += options.className;
      }

      if( options.role ){
        // set the role on the modal except when modal is a dialog tag and role is "dialog"
        if( !hasDialog || ( hasDialog && options.role !== 'dialog' ) ){
          el.setAttribute( 'role', options.role );
        }
      }
      // allow the modal to be focusable when there's no role provided
      else{
        el.setAttribute( 'tabindex', '-1' );
      }

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
        var modalNumber = this.modalStack.length + 1,
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

    },

    disableDocument: function(){
      // console.time( 'disableDocument' );
      // set the document as disabled
      this.documentDisabled = true;

      var tabindex,
          hidden,
          currentModal = this.modalStack[0],
          disabledElement = [],
          hiddenElements = [];

      // loop over all focusable element in the dom to set their "tabindex" to -1 if >= 0
      Array.prototype.forEach.call( document.querySelectorAll( focusables ), function( el ){

        // skip focusable element contained in the modal
        if( currentModal.contains( el ) ){
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

      } );

      // store "disabled" elements to loop on it later
      this.disabledElement = disabledElement;
      // console.timeEnd( 'disableDocument' );

      Array.prototype.forEach.call( currentModal.parentNode.children, function( el ){

        if( 'SCRIPT' === el.nodeName || el === currentModal ){
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

      } );

      this.hiddenElements = hiddenElements;
    },

    display: function( modal ){

      // explicitly hide the modal
      modal.setAttribute( 'aria-hidden', 'false' );

      // modal.style.display = 'none';

      modal.className += modal.options.hiddenClass;

      // force the modal to be a child of body
      if( modal.parentNode !== document.body ){
        document.body.appendChild( modal );
      }

      if( modal.options.isDialog ){
        modal.showModal();
      }

      raf( function(){
        modal.className = modal.className.replace( modal.options.hiddenClass, '' );
      } );

    },

    enableDocument: function(){
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
    },

    enableElement: function( el ){
      // remove current tabindex if there was none before opening the modal
      if( !el.defaultTabindex ){
        el.removeAttribute( 'tabindex' );
        return;
      }

      // set the tabindex to its previous value
      el.setAttribute( 'tabindex', el.defaultTabindex );
      delete el.defaultTabindex;
    },

    enableModal: function( modal ){
      // temporary array of focusable element that are not in the modal
      var leftDisabled = [];

      this.disabledElement.forEach( function( el ){

        if( !modal.contains( el ) ){
          leftDisabled.push( el );
          return;
        }

        this.enableElement( el );

      }.bind( this ) );

      // update the array of disabled elements
      this.disabledElement = leftDisabled;
    },

    findInteractiveElement: function( modal ){
      var firstCloseBtn;

      // always focus the first element with the "autofocus" attribute
      modal.firstInteractiveElement = modal.querySelector( '[autofocus]' );

      if( modal.firstInteractiveElement ){
        return;
      }

      // search for every focusable element in the modal
      Array.prototype.some.call( modal.querySelectorAll( focusables ), function( el ){
        var closeBtn;
        if( modal.closeBtns && modal.closeBtns.indexOf( el ) > -1 ){
          closeBtn = el;
          if( !firstCloseBtn ){
            firstCloseBtn = closeBtn;
          }
        }
        // test if focusable element is visible and not a close button
        if( ( el.offsetWidth || el.offsetHeight ) && !closeBtn ){
          modal.firstInteractiveElement = el;
          return true;
        }
      } );

      if( !modal.firstInteractiveElement ){
        // fallback on the first close button
        modal.firstInteractiveElement = firstCloseBtn ;
      }
    },

    focus: function( modal ){

      // search for the first focusable element
      if( !modal.firstInteractiveElement ){
        this.findInteractiveElement( modal );
      }

      // focus the first focusable element
      modal.firstInteractiveElement.focus();
    },

    handleClick: function( e ){
      var modal = this.modalStack[0];

      // don't close if the click doesn't come from the modal itself
      // or if we don't want to close it when clicking outside of the modal's content
      if( modal.options.outerClose === false || e.target !== modal ){
        return;
      }

      this.handleClose( e, 'cancel' );
    },

    handleClose: function( e, result ){

      // get the current modal
      var modal = this.modalStack[0];

      // prevent the default behaviour of the escape key on a dialog element
      if( 'cancel' === e.type ){
        e.preventDefault();
      }

      // don't close on cancel if role is 'alertdialog'
      if( 'alertdialog' === modal.options.role && ( 'cancel' === e.type || 'cancel' === result ) ){
        return;
      }

      // remove all eventListeners
      this.unbind( modal );

      modal.className += modal.options.hiddenClass;

      // #TODO move this part
      window.setTimeout( function(){

        // use dialog close interface
        if( modal.options.isDialog ){
          modal.close( result );
        }
        else{
          // store the returnValue on the modal to mimic the dialog interface
          modal.returnValue = result;
        }

        // remove the modal form the DOM?
        modal.parentNode.removeChild( modal );

        modal.className = modal.className.replace( modal.options.hiddenClass, '' );

        // explicitly display the modal
        modal.setAttribute( 'aria-hidden', 'true' );

        // remove the modal from the modal's stack
        this.modalStack.splice( this.modalStack.indexOf( modal ), 1 );

        // if there's another modal opened focus it back when browser has no dialog interface
        // dialog automaticaly focus back to the previous dialog
        if( !modal.options.isDialog && this.modalStack[0] ){
          this.focus( this.modalStack[0] );
        }
        // when there's no more modals
        else if( !this.modalStack[0] ){
          // enable focusable elements
          if( !modal.options.isDialog ){
            this.enableDocument();
          }
          // focus the button that was used to open the modal or fallback on the body
          ( modal.options.opener || document.body ).focus();
        }

      }.bind( this ), 300 );
    },

    handleKeydown: function( e ){
      var modal = this.modalStack[0];

      // close the modal on escape press if its not a dialog tag
      if( !modal.options.isDialog && 27 === e.keyCode ){
        this.handleClose( e, 'cancel' );
        return;
      }
    },

    initDom: function( el, options ){
      // store options
      el.options = options || {};

      // test if el is a dialog tag
      if( el.nodeName === 'DIALOG' ){
        if( hasDialog ){
          el.options.isDialog = true;
        }
        // don't allow dialog element if browser doesn't support the DOM interface
        else{
          throw new Error( 'The browser doesn’t support the dialog DOM interface.' );
        }
      }

      // add a tabindex -1 when the modal has no role and is not a dialog
      if( !el.hasAttribute( 'role' ) && !el.options.isDialog ){
        el.setAttribute( 'tabindex', '-1' );
      }

      return el;
    },

    modalStack: [],

    show: function( el, options ){
      var modal;

      // bind listeners
      if( !this.listeners ){
        this.listeners = {
          keydown: this.handleKeydown.bind( this ),
          click: this.handleClick.bind( this ),
          close: this.handleClose.bind( this )
        };
      }

      // test is passed element has already been processed by the modals
      if( !el.options ){
        // when passed element is a dialog and browser handle its interface
        if( el.nodeType === 1 ){
          modal = this.initDom( el, options );
        }
        // create the root element for the modal
        else if( typeof( el ) === 'object' ){
          modal = this.createDom( el );
        }
        else{
          throw new Error( 'Only a dialog tag is accepted as default parameter' );
        }

        // store all close buttons of the modal
        modal.closeBtns = Array.prototype.slice.call( modal.querySelectorAll( modal.options.closeSelector ) );

        if( !modal.closeBtns.length ){
          throw new Error( 'You must provide a valid selector with the key `closeSelector`. A modal must have a close button' );
        }

        if( modal.options.role ){
          this.validateModal( modal );
        }

        modal.options.hiddenClass = ' ' + ( modal.options.hiddenClass || 'modal-hidden' );

      }
      else{
        modal = el;
        // ensure the returnValue is an empty string
        modal.returnValue = '';
      }

      // prepend the modal in the modal stack
      this.modalStack.splice( 0, 0, modal );

      // bind eventListeners to the modal
      this.bind( modal );

      if( modal.getAttribute( 'aria-hidden' ) !== 'false' ){
        // display the modal
        this.display( modal );
      }

      this.focus( modal );

      // disable any focusable element not in the modal if
      if( !this.documentDisabled && !modal.options.isDialog ){
        this.disableDocument();
      }
      // in case we're passing a dom element check if it's focusable elements have not been "disabled"
      else if( this.documentDisabled && modal.options.dom ){
        this.enableModal( modal );
      }

      return modal;

    },

    showElement: function( el ){
      // remove current tabindex if there was none before opening the modal
      if( !el.defaultAriaHidden ){
        el.removeAttribute( 'aria-hidden' );
        return;
      }

      // set the tabindex to its previous value
      el.setAttribute( 'aria-hidden', el.defaultAriaHidden );
      delete el.defaultAriaHidden;
    },

    unbind: function( modal ){

      // remove listeners
      if( modal.options.isDialog ){
        modal.removeEventListener( 'cancel', this.listeners.close );
      }
      else{
        modal.removeEventListener( 'keydown', this.listeners.keydown, true );
      }

      // remove close button listeners
      modal.closeBtns.forEach( function( btn ){
        btn.removeEventListener( 'click', this.listeners.close );
      }.bind( this ) );
    },

    validateModal: function( modal ){
      var label = modal.getAttribute( 'aria-label' ),
          description = modal.getAttribute( 'aria-describedby' ),
          modalTitle;

      if( !label || ( label && label.trim().length > 0 ) ){
        modalTitle = modal.querySelector( '#'+modal.getAttribute( 'aria-labelledby' ) );

        if( !modalTitle || !modal.contains( modalTitle ) ){
          throw new Error( 'No title is present in the modal. Use the "data-label" attribute on the visible title or pass the label using the "label" key when showing the modal.' );
        }
      }

      if( 'alertdialog' === modal.options.role && !description ){
        throw new Error( '"alertdialog" modal needs a description, use the "data-description" attribute on the text content of the modal to validate the modal.' )
      }

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
