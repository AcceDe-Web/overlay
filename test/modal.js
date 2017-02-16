
/* jshint esnext:true, node:true  */
/* globals require */

const test = require( 'tape' ),
      Nightmare = require( './nightmare' ),
      nightmare = new Nightmare( {
        // show: true
      } );

nightmare.goto( 'http://localhost:3000/' );


// Label test suite in output
test( '-------------------------------', ( t ) => {
  t.comment( 'Running *Modal* test suite.' );
  t.comment( '-------------------------------' );
  t.end();
});

// test 1
test( '01| Le conteneur de la modale doit avoir la valeur « false » pour l’attribut « aria-hidden ».', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal1"]' )
    .wait( 50 )
    .evaluate(() => {
      var modal = document.querySelector( '.modal-wrapper' );
      return modal.getAttribute('aria-hidden');
    })
    .then(( ariaHidden ) => {
      t.equal( ariaHidden, 'false', '« aria-hidden » doit valoir « false ».' );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '02| Le focus clavier doit être positionné sur le premier élément interactif de la modale qui n’est pas un bouton de fermeture.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal1"]' )
    .wait( 50 )
    .evaluate(() => {
      var interactiveEl = document.querySelectorAll( '.modal-wrapper button' );
      // skip the first button which is the close button
      return interactiveEl[1] === document.activeElement;
    })
    .then(( interactiveElIsFocused ) => {
      t.true( interactiveElIsFocused );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '03| Le focus clavier se positionne sur le premier bouton de fermeture s’il n’y a pas d’autre éléments interactifs.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .evaluate(() => {
      var interactiveEl = document.querySelector( '.modal-wrapper .close' );
      // skip the first button which is the close button
      return interactiveEl === document.activeElement;
    })
    .then(( interactiveElIsFocused ) => {
      t.true( interactiveElIsFocused );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '04| La totalité des éléments interactifs hors de la modale sont désactivés.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .evaluate( () => {

      let interactiveEls = Array.from( document.querySelectorAll( 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contenteditable]' ) ),
          modal = document.querySelector( '.modal-wrapper' );

      let disabled = interactiveEls.every( el => {
        // skip interactive elements contained in the modal
        if( modal.contains( el ) ){
          return true;
        }

        return el.tabIndex < 0;
      } );

      return disabled;
    })
    .then( disabled => {

      t.true( disabled );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '05| La totalité de la page en arrière-plan n’est plus lisible.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .evaluate( () => {

      let bodyChildren = Array.from( document.body.children ),
          modal = document.querySelector( '.modal-wrapper' );

      let disabled = bodyChildren.every( el => {
        // skip the modal and script tags
        if( modal === el || 'SCRIPT' === el.nodeName  ){
          return true;
        }

        return el.getAttribute( 'aria-hidden' ) === 'true';
      } );

      return disabled;
    })
    .then( disabled => {
      t.true( disabled );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '06| La touche « echap » permet de fermer la modale.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .key( 27 )
    .wait( 500 )
    .evaluate( () => {

      let modal = document.querySelector( '.modal-wrapper' );

      return modal.getAttribute('aria-hidden') === 'true';
    })
    .then( closed => {
      t.true( closed );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '07| Un clic en dehors du contenu de la modale ferme la modale.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .click( '.modal-wrapper' )
    .wait( 500 )
    .evaluate( () => {

      let modal = document.querySelector( '.modal-wrapper' );

      return modal.getAttribute('aria-hidden') === 'true';
    })
    .then( closed => {
      t.true( closed );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '08| Un clic sur un bouton de fermeture ferme la modale.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .click( '.modal-wrapper .close' )
    .wait( 500 )
    .evaluate( () => {

      let modal = document.querySelector( '.modal-wrapper' );

      return modal.getAttribute('aria-hidden') === 'true';
    })
    .then( closed => {
      t.true( closed );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});


test( '09| Un clic dans le contenu de la modal ne ferme pas la modale.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .click( '.modal-wrapper .modal.modal2' )
    .wait( 500 )
    .evaluate( () => {

      let modal = document.querySelector( '.modal-wrapper' );

      return modal.getAttribute('aria-hidden') === 'false';
    })
    .then( opened => {
      t.true( opened );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '10| Après fermeture, la totalité des éléments interactifs hors de la modale sont réactivés.', ( t ) => {
  nightmare.refresh()
    .evaluate( () => {

      window.interactiveEls = Array.from( document.querySelectorAll( 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contenteditable]' ) );

      window.interactiveEls.forEach( el => {
        el.testIndex = el.tabIndex;
      } );

    })
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .key( 27 )
    .wait( 500 )
    .evaluate( () => {
      return window.interactiveEls.every( el => {
        return el.testIndex === el.tabIndex;
      } );
    })
    .then( ok => {
      t.true( ok );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '11| Après fermeture, la totalité de la page en arrière-plan est lisible.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .key( 27 )
    .wait( 500 )
    .evaluate( () => {

      let bodyChildren = Array.from( document.body.children );

      return bodyChildren.every( el => {
        let isModal = el.classList.contains('modal-wrapper');
        return ( isModal && el.getAttribute( 'aria-hidden' ) === 'true' )
            || ( !isModal && !el.hasAttribute( 'aria-hidden' ))
            || ( !isModal && el.getAttribute( 'aria-hidden' ) === 'false' );
      });
    })
    .then( readable => {
      t.true( readable );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '12| Après fermeture, la modale doit avoir la valeur « true » pour l’attribut « aria-hidden ».', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .evaluate( () => {
      window.currentModal = document.querySelector( '.modal-wrapper' );
    } )
    .key( 27 )
    .wait( 500 )
    .evaluate( () => {
      const modalOpener = document.querySelector( '[data-open=".modal2"]' );
      return modalOpener.modal.el.getAttribute( 'aria-hidden' ) === 'true';
    })
    .then( hidden => {
      t.true( hidden );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '13| Après fermeture, le focus est placé sur l’élément interactif déclencheur de l’ouverture.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal2"]' )
    .wait( 50 )
    .key( 27 )
    .wait( 500 )
    .evaluate( () => {
      return document.activeElement === document.querySelector( '[data-open=".modal2"]' );
    })
    .then( focused => {
      t.true( focused );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    } );
});

test( '-------------------------------', ( t ) => {
  t.comment( 'Test suite done' );
  t.comment( '-------------------------------' );
  nightmare.end()
  .then( () => {
    t.end();
  });
});

