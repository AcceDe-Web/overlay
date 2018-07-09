/**
 * Methods to disable or enable interactive elements from a context element
 */

const focusables = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contentEditable]';

/**
 * disable the focusable elements located in the context
 * @param {HTMLElement} context - the element where to look for focusable elements
 */
function set( context = document.body, activeElement ){
  // if context already has disabled elements dont set inert
  if( context.disabledElements ){
    return;
  }

  const disabledElements = [];
  const hiddenElements = [];

  // loop over all focusable element in the dom to set their "tabindex" to -1 if >= 0
  Array.prototype.forEach.call( context.querySelectorAll( focusables ), el => {
    // skip focusable element contained in the activeElement
    if( activeElement && activeElement.contains( el ) || el.closest( '[hidden]' )){
      return;
    }

    const tabindex = parseInt( el.getAttribute( 'tabindex' ), 10 );

    if( tabindex ){
      // don't change the tabindex if it is < 0
      if( tabindex < 0 ){
        return;
      }

      // store previous setted tabindex
      el.defaultTabindex = tabindex;
    }

    // store the focusable element so we can loop on it later
    disabledElements.push( el );

    // "disable" the element
    el.setAttribute( 'tabindex', '-1' );
  });

  // store "disabled" elements to loop on it later
  context.disabledElements = disabledElements.length ? disabledElements : null;

  if( activeElement ){
    Array.prototype.forEach.call( activeElement.parentNode.children, el => {
      if( el.nodeName === 'SCRIPT' || el === activeElement ){
        return;
      }

      const hidden = el.getAttribute( 'aria-hidden' );

      if( hidden ){
        if( hidden === 'true' ){
          return;
        }

        el.defaultAriaHidden = hidden;
      }

      el.setAttribute( 'aria-hidden', 'true' );

      hiddenElements.push( el );
    });
  }
  else {
    context.setAttribute( 'aria-hidden', 'true' );

    hiddenElements.push( context );
  }

  context.hiddenElements = hiddenElements.length ? hiddenElements : null;
}

function unset( context = document.body ){
  const disabledElements = context.disabledElements || Array.from( context.querySelectorAll( focusables ));
  const hiddenElements = context.hiddenElements || [ context ];

  disabledElements.forEach( el => {
    const defaultTabindex = el.defaultTabindex;

    if( !defaultTabindex ){
      el.removeAttribute( 'tabindex' );

      return;
    }

    // set the tabindex to its previous value
    el.setAttribute( 'tabindex', defaultTabindex );
    el.defaultTabindex = null;
  });

  context.disabledElements = null;

  hiddenElements.forEach( el => {
    const defaultAriaHidden = el.defaultAriaHidden;

    if( !defaultAriaHidden ){
      el.removeAttribute( 'aria-hidden' );

      return;
    }

    // set the tabindex to its previous value
    el.setAttribute( 'aria-hidden', defaultAriaHidden );
    el.defaultAriaHidden = null;
  });

  context.hiddenElements = null;
}

export default { set, unset, focusables };
