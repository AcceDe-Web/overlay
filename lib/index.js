import inert from './inert';

const callbackEvents = [ 'hide', 'show' ];

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
const Modal = function Modal( el, options ){
  this.listeners = {
    keydown: this.handleKeydown.bind( this ),
    click: this.handleClick.bind( this ),
    close: this.handleClose.bind( this )
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

  this.init( el );
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
    show: this.show.bind( this ),
    hide: this.hide.bind( this ),
    on: this.on.bind( this ),
    off: this.off.bind( this )
  };
};


// store a counter of modals in case we need to dynamicaly create id's
Modal.modalIndex = 0;

/**
 * Register all needed events
 */
Modal.prototype.bind = function(){
  // listen for keystrokes
  this.el.addEventListener( 'keydown', this.listeners.keydown, true );

  // listen for clicks
  this.el.addEventListener( 'click', this.listeners.click );

  // bind click events on every element targeted by the "closeSelector" option
  this.el.closeBtns.forEach( button => {
    button.addEventListener( 'click', this.listeners.close );
  });
};

/**
 * Create modal DOM
 * @returns {HTMLElement} Modal root HTML element
 */
Modal.prototype.createDom = function(){
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
    else{
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
    if( !this.options.label && !el.hasAttribute( 'aria-labelledby' ) && !el.hasAttribute( 'aria-label' )){
      const title = el.querySelector( this.options.titleSelector || '[data-label]' );
      let titleId;

      if( title ){
        titleId = title.id || `modalTitle${modalNumber}`;
        title.id = titleId;

        el.setAttribute( 'aria-labelledby', titleId );
      }
    }

    // look for a description
    if( !el.hasAttribute( 'aria-describedby' )){
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
};


/**
 * Disable all focusable DOM elements that do not belong to the modal
 */
Modal.prototype.disableDocument = function(){
  // set the document as disabled
  this.documentDisabled = true;
  inert.set( document.body, this.el );
};


/**
 * Enable all focusable DOM elements that do not belong to the modal
 */
Modal.prototype.enableDocument = function(){
  inert.unset( document.body );

  // document is now completely enabled
  this.documentDisabled = false;
};


/**
 * Enabling only modal focusable elements
 */
Modal.prototype.enableModal = function(){
  inert.unset( this.el );
};


/**
 * Find first interactive element that is not a close button
 */
Modal.prototype.findInteractiveElement = function(){
  // always focus the first element with the "autofocus" attribute
  this.el.firstInteractiveElement = this.el.querySelector( '[autofocus]' );

  if( this.el.firstInteractiveElement ){
    return;
  }

  // search for every focusable element in the modal
  Array.prototype.some.call( this.el.querySelectorAll( inert.focusables ), el => {
    let closeBtn;

    if( this.el.closeBtns && this.el.closeBtns.indexOf( el ) > -1 ){
      closeBtn = el;
    }

    // test if focusable element is visible and not a close button
    if(( el.offsetWidth || el.offsetHeight ) && !closeBtn ){
      this.el.firstInteractiveElement = el;
      return true;
    }

    return false;
  });

  if( !this.el.firstInteractiveElement && this.el.closeBtns ){
    // fallback on the first close button
    this.el.firstInteractiveElement = this.el.closeBtns[ 0 ];
  }
};


/**
 * Set focus on modal first interactive element
 */
Modal.prototype.focus = function(){
  // search for the first focusable element
  if( !this.el.firstInteractiveElement ){
    this.findInteractiveElement();
  }

  // focus the first focusable element
  window.requestAnimationFrame(() => {
    this.el.firstInteractiveElement.focus();
  });
};


/**
 * Handle click behaviours
 * @param {Object} e `click` DOM event
 */
Modal.prototype.handleClick = function( event ){
  // don't close if the click doesn't come from the modal itself
  // or if we don't want to close it when clicking outside of the modal's content
  if( this.options.closeOnCancel === false || event.target !== this.el ){
    return;
  }

  this.handleClose( event, 'cancel' );
};


/**
 * Handle modal close behaviour
 * @param {Object} e DOM event object or object with a type property.
 * @param {string} returnValue Close action
 */
Modal.prototype.handleClose = function( event, returnValue ){
  // don't close on cancel if role is 'alertdialog'
  if( this.options.role === 'alertdialog' && returnValue === 'cancel' ){
    return;
  }

  // remove all event listeners
  this.unbind();

  this.trigger( 'hide', returnValue );

  this.el.setAttribute( 'aria-hidden', 'true' );

  if( this.options.modal ){
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
Modal.prototype.handleKeydown = function( event ){
  // close the modal on escape press if its not a dialog tag
  if( event.keyCode === 27 && this.options.closeOnCancel !== false ){
    this.handleClose( event, 'cancel' );

    return true;
  }

  return false;
};


/**
 * Hide modal behaviour
 */
Modal.prototype.hide = function(){
  this.handleClose({
    type: 'user'
  });
};


/**
 * Init modal
 * @param {innerHTML} el Complete modal DOM element
 * @returns {Object} Modal instance
 */
Modal.prototype.init = function( el ){
  // update the modalCount
  Modal.modalIndex++;

  // when passing a DOM element
  if( el ){
    this.el = this.initDom( el );
  }
  // create the root element for the modal
  else{
    this.el = this.createDom();
  }

  this.el.modal = this;

  // store all close buttons of the modal
  this.el.closeBtns = Array.from( this.el.querySelectorAll( this.options.closeSelector ));

  if( !this.el.closeBtns.length ){
    throw new Error( 'You must provide a valid selector with the key `closeSelector`. A modal must have a close button' );
  }

  // check if all necessary aria roles and attributes are present
  if( this.options.role ){
    this.validateModal();
  }

  // force the modal to be a child of body
  if( this.el.parentNode !== document.body ){
    document.body.appendChild( this.el );
  }

  return this;
};


/**
 * Init given modal DOM
 * @param {innerHTML} el Complete modal DOM element
 * @returns {HTMLElement} Modal root element
 */
Modal.prototype.initDom = function( el ){

  this.options.role = el.getAttribute( 'role' );

  if( this.options.modal ){
    this.setAttribute( 'aria-modal', 'true' );
  }

  return el;
};


/**
 * Handle removing modal handlers
 * @param {string} event Event name. Can be `hide`, `show`
 * @param {function} callback Callback function
 */
Modal.prototype.off = function( event, callback ){
  if( !this.callbacks[ event ]){
    return;
  }

  const callbackIndex = this.callbacks[ event ].indexOf( callback );

  if( callbackIndex < 0 ){
    return;
  }

  this.callbacks[ event ].splice( callbackIndex, 1 );
};


/**
 * Handle adding modal handlers
 * @param {string} event Event name. Can be `hide`, `show`
 * @param {function} callback Callback function
 */
Modal.prototype.on = function( event, callback ){
  if( callbackEvents.indexOf( event ) < 0 ){
    return;
  }

  if( !this.callbacks[ event ]){
    this.callbacks[ event ] = [];
  }

  this.callbacks[ event ].push( callback );
};


/**
 * Show modal behaviour
 */
Modal.prototype.show = function(){
  // bind eventListeners to the modal
  this.bind();

  // store the current focused element before focusing the modal
  this.options.opener = this.options.opener || document.activeElement;

  this.trigger( 'show' );

  if( this.el.getAttribute( 'aria-hidden' ) !== 'false' ){
    // display the modal
    this.el.setAttribute( 'aria-hidden', 'false' );
  }

  this.focus();

  // disable any focusable element not in the modal
  if( this.options.modal && !this.documentDisabled ){
    this.disableDocument();
  }
  // in case we're passing a dom element check if it's focusable elements have not been "disabled"
  else if( this.documentDisabled && this.options.dom ){
    this.enableModal();
  }
};

/**
 * Trigger callback associated to passed event
 * @param {string} eventName Event name. Can be `hide`, `show`.
 */
Modal.prototype.trigger = function( eventName, params ){
  if( !this.callbacks[ eventName ]){
    return;
  }

  this.callbacks[ eventName ].forEach( callback => {
    callback( this, params );
  });
};


/**
 * Remove all modal event bindings
 */
Modal.prototype.unbind = function(){
  // remove listeners
  this.el.removeEventListener( 'keydown', this.listeners.keydown, true );
  this.el.removeEventListener( 'click', this.listeners.click );

  // remove close button listeners
  this.el.closeBtns.forEach( button => {
    button.removeEventListener( 'click', this.listeners.close );
  });
};


/**
 * Validate modal a11y features and outputs an error if a11y is compromised
 */
Modal.prototype.validateModal = function(){
  const label = this.el.getAttribute( 'aria-label' );
  const description = this.el.getAttribute( 'aria-describedby' );
  let modalTitle;

  if( !label || ( label && label.trim().length < 0 )){
    modalTitle = this.el.querySelector( `#${this.el.getAttribute( 'aria-labelledby' )}` );

    if( !modalTitle || !this.el.contains( modalTitle )){
      throw new Error( 'No title is present in the modal. Use the "data-label" attribute on the visible title or pass the label using the "label" key when showing the modal.' );
    }
  }

  if( this.options.role === 'alertdialog' && !description ){
    throw new Error( '"alertdialog" modal needs a description, use the "data-description" attribute on the text content of the modal to validate the modal.' );
  }
};

export default Modal;
