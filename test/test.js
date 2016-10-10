
/* jshint esnext:true, node:true  */
/* globals require */

const test = require( 'tape' ),
      Nightmare = require( './nightmare' ),
      nightmare = new Nightmare( {
        // show: true
      } );

nightmare.goto( 'http://localhost:3000' );


// Label test suite in output
test( '-------------------------------', ( t ) => {
  t.comment( 'Running *Modal* test suite.' );
  t.comment( '-------------------------------' );
  t.end();
});

// test 1
test( '1| Le conteneur de la modale doit avoir la valeur « false » pour l’attribut « aria-hidden ».', ( t ) => {
  nightmare.refresh()
    .click( '[data-open=".modal1"]' )
    .evaluate(() => {
      var modal = document.querySelector( '.modal-wrapper' );
      return modal.getAttribute('aria-hidden');
    })
    .then(( ariaHidden ) => {
      t.equal( ariaHidden, 'false', '« aria-hidden » doit valoir « false ».' );
      t.end();
    });
});

// test( 'modal is open', t => {
//   nightmare.refresh()
//     .click( '[data-open=".modal1"]' )
//     .evaluate( () => {
//       return !!document.querySelector( '.modal-wrapper' );
//     } )
//     .then( is => {
//       t.ok( is );
//       t.end();
//     });
// } );


// test( 'modal is closed', t => {
//   nightmare.refresh()
//     .evaluate( () => {
//       return !!document.querySelector( '.modal-wrapper' );
//     } )
//     .then( isNot => {
//       t.notOk( isNot );
//       t.end();
//     } );
// });


test( '-------------------------------', ( t ) => {
  t.comment( 'Test suite done' );
  t.comment( '-------------------------------' );
  nightmare.end()
  .then( () => {
    t.end();
  });
});

