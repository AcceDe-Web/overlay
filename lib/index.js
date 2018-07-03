import inert from './inert';

const textualElements = 'h1, h2, h3, h4, h5, h6, p, ul, dl, figure, img, table, canvas, detail';

let layerIndex = 0;
let layerStack = [];

const cancelListener = event => {
  if( !layerStack.length || event.keyCode !== 27 ){
    return;
  }

  const topModal = layerStack[ 0 ].layer;

  topModal._dispatchEvent( 'cancel' );
};

class Overlay {
  static get layerIndex(){
    return layerIndex;
  }

  static get stack(){
    return layerStack.slice();
  }

  static set layerIndex( index ){
    layerIndex = index;
  }

  get returnValue(){
    return this.el.returnValue;
  }

  set returnValue( value ){
    if( typeof value === 'object' ){
      this.el.returnValue = JSON.stringify( value );

      return;
    }

    this.el.returnValue = value.toString();
  }

  addEventListener(){
    this.el.addEventListener.apply( this.el, arguments );
  }

  constructor( el, options ){

    this._handleCancel = this._handleCancel.bind( this );
    this._handleClick = this._handleClick.bind( this );
    this._handleClose = this._handleClose.bind( this );

    this.callbacks = {};

    options = arguments[ 1 ] || ( typeof arguments[ 0 ] === 'object' ? arguments[ 0 ] : {});
    el = options !== arguments[ 0 ] ? arguments[ 0 ] : undefined;

    // if element is a string, convert it to a DOM element
    if( typeof el === 'string' ){
      const wrapper = document.createElement( 'div' );

      wrapper.innerHTML = el;

      el = wrapper.firstChild;
    }

    if( !el && !options ){
      throw new Error( 'No parameter passed.' );
    }

    if( options.modal === undefined ){
      options.modal = true;
    }

    if( !options.closeOnCancel ){
      options.closeOnCancel = true;
    }

    this.options = options;

    this._init( el );
  }

  /**
   * Register all needed events
   */
  _bind(){
    // listen for clicks
    this.el.addEventListener( 'click', this._handleClick );

    // listen for cancel
    this.el.addEventListener( 'cancel', this._handleCancel );

    // bind click events on every element targeted by the "closeSelector" option
    if( this.el.closeBtns ){
      this.el.closeBtns.forEach( button => {
        button.addEventListener( 'click', this._handleClose );
      });
    }
  }

  /**
   * Create layer DOM
   * @returns {HTMLElement} Modal root HTML element
   */
  _createDom(){
    // create a layer root element
    const el = document.createElement( this.options.tagName || 'div' );

    // add user's classes
    if( this.options.className ){
      el.className += this.options.className;
    }

    el.setAttribute( 'aria-hidden', 'true' );

    if( this.options.modal ){
      el.setAttribute( 'aria-modal', 'true' );
    }

    // put content into the layer
    if( this.options.content ){
      if( typeof this.options.content === 'string' ){
        el.innerHTML = this.options.content;
      }
      else {
        el.appendChild( this.options.content );
      }
    }

    // set the label
    if( this.options.label ){
      el.setAttribute( 'aria-label', this.options.label );
    }

    // look for a label and a description inside the layer
    if( this.options.role ){
      el.setAttribute( 'role', this.options.role );
      const layerNumber = Overlay.layerIndex;

      // always provide a label when layer has a role
      if( !this.options.label && !el.hasAttribute( 'aria-labelledby' ) && !el.hasAttribute( 'aria-label' )) {
        const title = el.querySelector( this.options.titleSelector || '[data-label]' );
        let titleId;

        if( title ){
          titleId = title.id || `layerTitle${layerNumber}`;
          title.id = titleId;
          el.setAttribute( 'aria-labelledby', titleId );
        }
      }

      // look for a description
      if( !el.hasAttribute( 'aria-describedby' )) {
        const description = el.querySelector( '[data-description]' );
        let descriptionId;

        if( description ){
          descriptionId = description.id || `layerDescription${layerNumber}`;
          description.id = descriptionId;
          el.setAttribute( 'aria-describedby', descriptionId );
        }
      }
    }

    return el;
  }

  /**
   * Disable all focusable DOM elements that do not belong to the layer
   */
  _disableDocument(){
    // set the document as disabled
    this.documentDisabled = true;
    inert.set( document.body, this.el );
  }

  _dispatchEvent( eventName ){
    const eventParams = {
      cancelable: eventName === 'cancel'
    };

    const event = new window.CustomEvent( eventName, eventParams );

    this.el.dispatchEvent( event );
  }

  /**
   * Enable all focusable DOM elements that do not belong to the layer
   */
  _enableDocument(){
    inert.unset( document.body );
    // document is now completely enabled
    this.documentDisabled = false;
  }

  /**
   * Enabling only layer focusable elements
   */
  _enableLayer(){
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

    // search for every focusable element in the layer
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

    // search for every focusable element in the layer
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
   * Set focus on layer first interactive element
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

  _handleCancel( event ){
    if( event.defaultPrevented || this.options.role === 'alertdialog' ){
      return;
    }

    this._handleClose( event );
  }

  /**
   * Handle click behaviours
   * @param {MouseEvent} event `click` DOM event
   */
  _handleClick( event ){
    // don't close if the click doesn't come from the layer itself
    // or if we don't want to close it when clicking outside of the layer's content
    if( this.options.closeOnCancel === false || event.target !== this.el ){
      return;
    }

    // don't close when clicking outside an alertdialog
    if( event.target === this.el && this.options.role === 'alertdialog' ){
      return;
    }

    this._dispatchEvent( 'cancel' );
  }
  /**
   * Handle layer close behaviour
   * @param {Object} event DOM event object or object with a type property.
   */
  _handleClose(){

    // remove all event listeners
    this._unbind();
    this._dispatchEvent( 'close' );
    this.el.setAttribute( 'aria-hidden', 'true' );

    if( this.options.modal && layerStack.length === 1 ){
      // enable focusable elements
      this._enableDocument();
    }

    // update the layer stack
    layerStack.splice( layerStack.indexOf( this.el ), 1 );

    // focus the button that was used to open the layer or fallback on the body
    this.options.opener.focus();
  }

  /**
   * Close layer behaviour
   * @param {string} returnValue the value the layer will return
   */
  close( returnValue ){

    if( returnValue ){
      this.el.returnValue = returnValue;
    }

    this._handleClose();
  }
  /**
   * Init layer
   * @param {HTMLElement} el Complete layer DOM element
   * @returns {Object} Modal instance
   */
  _init( el ){
    // update the layer index
    Overlay.layerIndex++;
    // when passing a DOM element
    if( el ){
      this.el = this._initDom( el );
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

    // force the layer to be a child of body
    if( this.el.parentNode !== document.body ){
      document.body.appendChild( this.el );
    }

    return this;
  }
  /**
   * Init given layer DOM
   * @param {HTMLElement} el Complete layer DOM element
   * @returns {HTMLElement} Modal root element
   */
  _initDom( el ){
    this.options.role = el.getAttribute( 'role' );

    if( this.options.modal ){
      el.setAttribute( 'aria-modal', 'true' );
    }

    return el;
  }

  removeEventListener(){
    this.el.removeEventListener.apply( this.el, arguments );
  }
  /**
   * Show layer behaviour
   */
  show(){
    // add the new layer at the top of the stack
    layerStack.unshift( this.el );

    // set the default returnValue of the layer
    this.returnValue = '';

    // bind eventListeners to the layer
    this._bind();
    // store the current focused element before focusing the layer
    this.options.opener = this.options.opener || document.activeElement;
    // IE can't focus a svg element
    if( this.options.opener.nodeName === 'svg' ){
      this.options.opener = this.options.opener.parentNode;
    }

    if( this.el.getAttribute( 'aria-hidden' ) !== 'false' ){
      // display the layer
      this.el.setAttribute( 'aria-hidden', 'false' );
    }

    this._focus();

    // disable any focusable element not in the layer
    if( layerStack.length === 1 && this.options.modal && !this.documentDisabled ){
      this._disableDocument();
    }
    // in case we're passing a dom element check if it's focusable elements have not been "disabled"
    else if( this.documentDisabled && this.options.content ){
      this._enableLayer();
    }
  }
  /**
   * Remove all layer event bindings
   */
  _unbind(){
    // remove listeners
    this.el.removeEventListener( 'click', this._handleClick );
    this.el.removeEventListener( 'click', this._handleCancel );

    // remove close button listeners
    if( this.el.closeBtns ){
      this.el.closeBtns.forEach( button => {
        button.removeEventListener( 'click', this._handleClose );
      });
    }
  }
  /**
   * Validate layer a11y features and outputs an error if a11y is compromised
   */
  _validateModal(){
    const label = this.el.getAttribute( 'aria-label' );
    const description = this.el.getAttribute( 'aria-describedby' );
    let layerTitle;

    if( !label || ( label && label.trim().length < 0 )) {
      layerTitle = this.el.querySelector( `#${this.el.getAttribute( 'aria-labelledby' )}` );
      if( !layerTitle || !this.el.contains( layerTitle )) {
        throw new Error( 'No title is present in the layer. Use the "data-label" attribute on the visible title or pass the label using the "label" key when creating the layer.' );
      }
    }

    if( this.options.role === 'alertdialog' && !description ){
      throw new Error( '"alertdialog" layer needs a description, use the "data-description" attribute on the text content of the layer to validate the layer.' );
    }
  }
}

// listen to the escape key to close the top-most layer
document.body.addEventListener( 'keydown', cancelListener );

export default Overlay;
