import inert from './inert';

const callbackEvents = [ 'hide', 'show' ];
const textualElements = 'h1, h2, h3, h4, h5, h6, p, ul, dl, figure, img, table, canvas, detail';

let modalIndex = 0;
let modalCount = 0;

class Modal {
  static get modalCount(){
    return modalCount;
  }

  static get modalIndex(){
    return modalIndex;
  }

  static set modalCount( count ){
    modalCount = count;
  }

  static set modalIndex( index ){
    modalIndex = index;
  }

  constructor( el, options ){
    this.listeners = {
      keydown: this._handleKeydown.bind( this ),
      click: this._handleClick.bind( this ),
      close: this._handleClose.bind( this )
    };

    this.callbacks = {};

    options = arguments[ 1 ] || typeof ( arguments[ 0 ]) === 'object' ? arguments[ 0 ] : {};
    el = options !== arguments[ 0 ] ? arguments[ 0 ] : undefined;

    if( !el && !options ){
      throw new Error( 'No parameter passed.' );
    }

    if( !options.modal ){
      options.modal = true;
    }

    this.options = options;

    this._init( el );
  }

  /**
   * Register all needed events
   */
  _bind(){
    // listen for keystrokes
    this.el.addEventListener( 'keydown', this.listeners.keydown, true );
    // listen for clicks
    this.el.addEventListener( 'click', this.listeners.click );

    // bind click events on every element targeted by the "closeSelector" option
    if( this.el.closeBtns ){
      this.el.closeBtns.forEach( button => {
        button.addEventListener( 'click', this.listeners.close );
      });
    }
  }

  /**
   * Create modal DOM
   * @returns {HTMLElement} Modal root HTML element
   */
  _createDom(){
    // create a modal root element
    const el = document.createElement( this.options.tagName || 'div' );

    // add user's classes
    if( this.options.className ){
      el.className += this.options.className;
    }

    el.setAttribute( 'aria-hidden', 'true' );

    if( this.options.modal ){
      el.setAttribute( 'aria-modal', 'true' );
    }

    // put content into the modal
    if( this.options.dom ){
      if( typeof this.options.dom === 'string' ){
        el.innerHTML = this.options.dom;
      }
      else {
        el.appendChild( this.options.dom );
      }
    }

    // set the label
    if( this.options.label ){
      el.setAttribute( 'aria-label', this.options.label );
    }

    // look for a label and a description inside the modal
    if( this.options.role ){
      el.setAttribute( 'role', this.options.role );
      const modalNumber = Modal.modalIndex;

      // always provide a label when modal has a role
      if( !this.options.label && !el.hasAttribute( 'aria-labelledby' ) && !el.hasAttribute( 'aria-label' )) {
        const title = el.querySelector( this.options.titleSelector || '[data-label]' );
        let titleId;

        if( title ){
          titleId = title.id || `modalTitle${modalNumber}`;
          title.id = titleId;
          el.setAttribute( 'aria-labelledby', titleId );
        }
      }

      // look for a description
      if( !el.hasAttribute( 'aria-describedby' )) {
        const description = el.querySelector( '[data-description]' );
        let descriptionId;

        if( description ){
          descriptionId = description.id || `modalDescription${modalNumber}`;
          description.id = descriptionId;
          el.setAttribute( 'aria-describedby', descriptionId );
        }
      }
    }

    return el;
  }

  /**
   * Disable all focusable DOM elements that do not belong to the modal
   */
  _disableDocument(){
    // set the document as disabled
    this.documentDisabled = true;
    inert.set( document.body, this.el );
  }

  /**
   * Enable all focusable DOM elements that do not belong to the modal
   */
  _enableDocument(){
    inert.unset( document.body );
    // document is now completely enabled
    this.documentDisabled = false;
  }

  /**
   * Enabling only modal focusable elements
   */
  _enableModal(){
    inert.unset( this.el );
  }

  /**
   * Find first interactive element that is not a close button
   */
  _setInteractiveElement(){
    // always focus the first element with the "autofocus" attribute
    this.el.firstInteractiveElement = this.el.querySelector( '[autofocus]' );

    if( this.el.firstInteractiveElement ){
      return;
    }

    const screenHeight = window.innerHeight;

    // search for every focusable element in the modal
    Array.prototype.some.call( this.el.querySelectorAll( inert.focusables ), el => {
      let closeBtn;

      if( this.el.closeBtns && this.el.closeBtns.indexOf( el ) > -1 ){
        closeBtn = el;
      }

      const height = el.offsetHeight;
      const bottom = el.offsetTop + height;

      // test if focusable element is visible, not below the fold and not a close button
      if( bottom <= screenHeight && ( el.offsetWidth || el.offsetHeight ) && !closeBtn ){
        this.el.firstInteractiveElement = el;

        return true;
      }

      return false;
    });

    if( this.el.firstInteractiveElement ){
      return;
    }

    if( !this.el.firstInteractiveElement && this.el.closeBtns ){
      const firstCloseButton = this.el.closeBtns[ 0 ];
      const height = firstCloseButton.offsetHeight;
      const bottom = firstCloseButton.offsetTop + height;

      // fallback on the first close button if not below the fold
      if( bottom <= screenHeight ){
        this.el.firstInteractiveElement = firstCloseButton;

        return;
      }
    }

    // search for every focusable element in the modal
    Array.prototype.some.call( this.el.querySelectorAll( textualElements ), el => {
      // test if focusable element is visible and not a close button
      if(( el.offsetWidth || el.offsetHeight )){
        el.setAttribute( 'tabindex', '-1' );

        this.el.firstInteractiveElement = el;

        return true;
      }

      return false;
    });

  }

  /**
   * Set focus on modal first interactive element
   */
  _focus(){
    // search for the first focusable element
    if( !this.el.firstInteractiveElement ){
      this._setInteractiveElement();
    }

    // focus the first focusable element
    window.requestAnimationFrame(() => {
      this.el.firstInteractiveElement.focus();
    });
  }

  /**
   * Handle click behaviours
   * @param {Object} e `click` DOM event
   */
  _handleClick( event ){
    // don't close if the click doesn't come from the modal itself
    // or if we don't want to close it when clicking outside of the modal's content
    if( this.options.closeOnCancel === false || event.target !== this.el ){
      return;
    }

    this._handleClose( event, 'cancel' );
  }
  /**
   * Handle modal close behaviour
   * @param {Object} e DOM event object or object with a type property.
   * @param {string} returnValue Close action
   */
  _handleClose( event, returnValue ){
    // don't close on cancel if role is 'alertdialog'
    if( this.options.role === 'alertdialog' && returnValue === 'cancel' ){
      return;
    }

    // remove all event listeners
    this._unbind();
    this._trigger( 'hide', returnValue );
    this.el.setAttribute( 'aria-hidden', 'true' );

    if( this.options.modal && Modal.modalCount === 1 ){
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
  _handleKeydown( event ){
    // close the modal on escape press if its not a dialog tag
    if( event.keyCode === 27 && this.options.closeOnCancel !== false ){
      this._handleClose( event, 'cancel' );

      return true;
    }

    return false;
  }
  /**
   * Hide modal behaviour
   */
  hide(){
    this._handleClose({
      type: 'user'
    });
  }
  /**
   * Init modal
   * @param {innerHTML} el Complete modal DOM element
   * @returns {Object} Modal instance
   */
  _init( el ){
    // update the modalCount
    Modal.modalIndex++;
    // when passing a DOM element
    if( el ){
      this.el = this._initDom( el );
    }
    // create the root element for the modal
    else {
      this.el = this._createDom();
    }

    this.el.modal = this;

    // store all close buttons of the modal
    if( this.options.closeSelector ){
      this.el.closeBtns = Array.from( this.el.querySelectorAll( this.options.closeSelector ));

      if( !this.el.closeBtns.length ){
        delete this.el.closeBtns;
      }
    }


    // check if all necessary aria roles and attributes are present
    if( this.options.role ){
      this._validateModal();
    }

    // force the modal to be a child of body
    if( this.el.parentNode !== document.body ){
      document.body.appendChild( this.el );
    }

    return this;
  }
  /**
   * Init given modal DOM
   * @param {innerHTML} el Complete modal DOM element
   * @returns {HTMLElement} Modal root element
   */
  _initDom( el ){
    this.options.role = el.getAttribute( 'role' );

    if( this.options.modal ){
      el.setAttribute( 'aria-modal', 'true' );
    }

    return el;
  }
  /**
   * Handle removing modal handlers
   * @param {string} event Event name. Can be `hide`, `show`
   * @param {function} callback Callback function
   */
  off( event, callback ){
    if( !this.callbacks[ event ]) {
      return;
    }

    const callbackIndex = this.callbacks[ event ].indexOf( callback );

    if( callbackIndex < 0 ){
      return;
    }

    this.callbacks[ event ].splice( callbackIndex, 1 );
  }
  /**
   * Handle adding modal handlers
   * @param {string} event Event name. Can be `hide`, `show`
   * @param {function} callback Callback function
   */
  on( event, callback ){
    if( callbackEvents.indexOf( event ) < 0 ){
      return;
    }

    if( !this.callbacks[ event ]) {
      this.callbacks[ event ] = [];
    }

    this.callbacks[ event ].push( callback );
  }
  /**
   * Show modal behaviour
   */
  show(){
    Modal.modalCount++;
    // bind eventListeners to the modal
    this._bind();
    // store the current focused element before focusing the modal
    this.options.opener = this.options.opener || document.activeElement;
    // IE can't focus a svg element
    if( this.options.opener.nodeName === 'svg' ){
      this.options.opener = this.options.opener.parentNode;
    }

    this._trigger( 'show' );

    if( this.el.getAttribute( 'aria-hidden' ) !== 'false' ){
      // display the modal
      this.el.setAttribute( 'aria-hidden', 'false' );
    }

    this._focus();

    // disable any focusable element not in the modal
    if( Modal.modalCount === 1 && this.options.modal && !this.documentDisabled ){
      this._disableDocument();
    }
    // in case we're passing a dom element check if it's focusable elements have not been "disabled"
    else if( this.documentDisabled && this.options.dom ){
      this._enableModal();
    }
  }
  /**
   * Trigger callback associated to passed event
   * @param {string} eventName Event name. Can be `hide`, `show`.
   */
  _trigger( eventName, params ){
    if( !this.callbacks[ eventName ]) {
      return;
    }

    this.callbacks[ eventName ].forEach( callback => {
      callback( this, params );
    });
  }
  /**
   * Remove all modal event bindings
   */
  _unbind(){
    // remove listeners
    this.el.removeEventListener( 'keydown', this.listeners.keydown, true );
    this.el.removeEventListener( 'click', this.listeners.click );

    // remove close button listeners
    if( this.el.closeBtns ){
      this.el.closeBtns.forEach( button => {
        button.removeEventListener( 'click', this.listeners.close );
      });
    }
  }
  /**
   * Validate modal a11y features and outputs an error if a11y is compromised
   */
  _validateModal(){
    const label = this.el.getAttribute( 'aria-label' );
    const description = this.el.getAttribute( 'aria-describedby' );
    let modalTitle;

    if( !label || ( label && label.trim().length < 0 )) {
      modalTitle = this.el.querySelector( `#${this.el.getAttribute( 'aria-labelledby' )}` );
      if( !modalTitle || !this.el.contains( modalTitle )) {
        throw new Error( 'No title is present in the modal. Use the "data-label" attribute on the visible title or pass the label using the "label" key when showing the modal.' );
      }
    }

    if( this.options.role === 'alertdialog' && !description ){
      throw new Error( '"alertdialog" modal needs a description, use the "data-description" attribute on the text content of the modal to validate the modal.' );
    }
  }
}

export default Modal;
