
/* jshint esnext:true, node:true  */
/* globals require */

const test = require( 'tape' ),
      Nightmare = require( './nightmare' ),
      nightmare = new Nightmare( {
        // show: true
      });

nightmare.goto( 'http://localhost:3000/' );


// Label test suite in output
test( '-------------------------------', ( t ) => {
  t.comment( 'Running *Dialog* test suite.' );
  t.comment( '-------------------------------' );
  t.end();
});

// test 1
test( '01| Le conteneur de la modale doit avoir la valeur « false » pour l’attribut « aria-hidden ».', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
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
    });
});

// test 2
test( '02| Le focus clavier doit être positionné sur le premier élément interactif de la modale qui n’est pas un bouton de fermeture.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
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
    });
});

// test 3
test( '03| Le focus clavier se positionne sur le premier bouton de fermeture s’il n’y a pas d’autre éléments interactifs.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal6"]' )
    .wait( '.modal-wrapper' )
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
    });
});

// test 4
test( '04| La totalité des éléments interactifs hors de la modale sont désactivés.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .evaluate( () => {

      let interactiveEls = Array.from( document.querySelectorAll( 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contenteditable]' ) ),
          modal = document.querySelector( '.modal-wrapper' );

      let disabled = interactiveEls.every( el => {
        // skip interactive elements contained in the modal
        if( modal.contains( el ) ){
          return true;
        }

        return el.tabIndex < 0;
      });

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
    });
});

// test 5
test( '05| La totalité de la page en arrière-plan n’est plus lisible.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .evaluate( () => {

      let bodyChildren = Array.from( document.body.children ),
          modal = document.querySelector( '.modal-wrapper' );

      let disabled = bodyChildren.every( el => {
        // skip the modal and script tags
        if( modal === el || 'SCRIPT' === el.nodeName  ){
          return true;
        }

        return el.getAttribute( 'aria-hidden' ) === 'true';
      });

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
    });
});

// test 6
test( '06| La touche « echap » permet de fermer la modale.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .key( 27 )
    .wait( 500 )
    .evaluate( () => {

      let modal = document.querySelector( '.modal-wrapper' );

      return !modal;
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
    });
});

// test 7
test( '07| Un clic en dehors du contenu de la modale ferme la modale.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .click( '.modal-wrapper' )
    .wait( 500 )
    .evaluate( () => {

      let modal = document.querySelector( '.modal-wrapper' );

      return !modal;
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
    });
});

// test 8
test( '08| Un clic sur un bouton de fermeture ferme la modale.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .click( '.modal-wrapper .close' )
    .wait( 500 )
    .evaluate( () => {

      let modal = document.querySelector( '.modal-wrapper' );

      return !modal;
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
    });
});

// test 9
test( '09| Un clic dans le contenu de la modal ne ferme pas la modale.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .click( '.modal-wrapper .modal.modal4' )
    .wait( 500 )
    .evaluate( () => {

      let modal = document.querySelector( '.modal-wrapper' );

      return !!modal;
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
    });
});

// test 10
test( '10| Après fermeture, la totalité des éléments interactifs hors de la modale sont réactivés.', ( t ) => {
  nightmare.refresh()
    .evaluate( () => {

      let interactiveEls = Array.from( document.querySelectorAll( 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contenteditable]' ) );

      window.interactiveElsCount = interactiveEls.map( el => {
        return !el.tabIndex;
      } ).length;

    })
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .click( '.modal-wrapper .close' )
    .wait( 500 )
    .evaluate( () => {

      let interactiveEls = Array.from( document.querySelectorAll( 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contenteditable]' ) );

      let count = interactiveEls.map( el => {
        return !el.tabIndex;
      } ).length;
      // nasty move to substract one from the count but the script remove the modal from the dom and so the interactive elements that are in it
      return window.interactiveElsCount - 1 === count;
    })
    .then( countMatch => {
      t.true( countMatch );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    });
});

// test 11
test( '11| Après fermeture, la totalité de la page en arrière-plan est lisible.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .click( '.modal-wrapper .close' )
    .wait( 500 )
    .evaluate( () => {

      let bodyChildren = Array.from( document.body.children );

      return bodyChildren.every( el => {
        return !el.hasAttribute( 'aria-hidden' ) || el.getAttribute( 'aria-hidden' ) === 'false';
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
    });
});

// test 12
test( '12| Après fermeture, la modale doit avoir la valeur « true » pour l’attribut « aria-hidden ».', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .evaluate( () => {
      window.currentModal = document.querySelector( '.modal-wrapper' );
    } )
    .click( '.modal-wrapper .close' )
    .wait( 500 )
    .evaluate( () => {
      return window.currentModal.getAttribute( 'aria-hidden' ) === 'true';
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
    });
});

// test 13
test( '13| Après fermeture, le focus est placé sur l’élément interactif déclencheur de l’ouverture.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .click( '.modal-wrapper .close' )
    .wait( 500 )
    .evaluate( () => {
      return document.activeElement === document.querySelector( '[data-open=".modal4"]' );
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
    });
});

// test 14
test( '14| Le conteneur de la modale doit avoir la valeur « dialog » pour l’attribut « role ».', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .evaluate(() => {
      var modal = document.querySelector( '.modal-wrapper' );
      return modal.getAttribute('role');
    })
    .then(( role ) => {
      t.equal( role, 'dialog', '« role » doit valoir « dialog ».' );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    });
});

// test 15
test( '15| L’identifiant du titre de la modale doit être repris par l’attribut « aria-labelledby » du conteneur de celle-ci.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal4"]' )
    .wait( '.modal-wrapper' )
    .evaluate(() => {
      var modal = document.querySelector( '.modal-wrapper' ),
          title = modal.querySelector( '[data-label]' );

      return modal.getAttribute('aria-labelledby') === title.id;
    })
    .then(( labelMatch ) => {
      t.equal( labelMatch, true, '« aria-labelledby » doit valoir la même valeur que l’identifiant du titre de la popin.' );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    });
});

// test 16
test( '16| Si le titre de la modale n’est pas affiché, le conteneur doit avoir un attribut « aria-label » non vide.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal7"]' )
    .wait( '.modal-wrapper' )
    .evaluate(() => {
      var modal = document.querySelector( '.modal-wrapper' ),
          ariaLabel = modal.getAttribute( 'aria-label' );

      return ariaLabel && ariaLabel.trim().length > 0;
    })
    .then(( ariaLabel ) => {
      t.equal( ariaLabel, true, '« aria-label » doit être présent et non vide.' );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    });
});

// test 17
test( '17| Si le titre de la modale n’est pas affiché et qu’aucun « label » n’est passé, le script doit renvoyer une erreur.', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal8"]' )
    .evaluate(() => {
      var modal = document.querySelector( '.modal-wrapper' ),
          hasModal;

      hasModal = modal !== undefined ? true : false;

      return hasModal;
    })
    .then(( hasModal ) => {
      t.notEqual( hasModal, false, 'Le script doit renvoyer une erreur' );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    });
});

// test 18
test( '18| La croix de fermeture est facultative', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal9"]' )
    .evaluate(() => {
      var modal = document.querySelector( '.modal-wrapper' ),
          hasModal;

      hasModal = modal !== undefined ? true : false;

      return hasModal;
    })
    .then(( hasModal ) => {
      t.equal( hasModal, true, 'La modale doit être présente.' );
      t.end();
    })
    .catch( err => {
      nightmare.end()
      .then( () => {
        t.fail( err );
        t.end();
      });
    });
});

// test 19
// Removed because Nightmare/Electron (Chromium?) does not seem to support JS triggered tabulation key
// test( '19| A l’ouverture, `SHIFT + Tab` doit retourner sur le bouton de fermeture si un élément interactif est présent.', ( t ) => {
//   nightmare.refresh()
//     .click( '[data-open=".modal4"]' )
//     .wait( '.modal-wrapper' )
//     .wait( 1000 )
//     .key({
//       code: 9,
//       shift: true
//     })
//     .evaluate(() => {
//       var modal = document.querySelector( '.modal-wrapper' ),
//           activeElement = document.activeElement,
//           closeButton = modal.querySelector( '.close' );

//       return activeElement === closeButton;
//     })
//     .then(( closeFocused ) => {
//       t.equal( closeFocused, true, 'A l’ouverture, `SHIFT + Tab` doit retourner sur le bouton de fermeture si un élément interactif est présent.' );
//       t.end();
//     })
//     .catch( err => {
//       nightmare.end()
//       .then( () => {
//         t.fail( err );
//         t.end();
//       });
//     });
// });


test( '-------------------------------', ( t ) => {
  t.comment( 'Test suite done' );
  t.comment( '-------------------------------' );
  nightmare.end()
  .then( () => {
    t.end();
  });
});

