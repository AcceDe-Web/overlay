
/* jshint esnext:true, node:true  */
/* globals require */

const test = require( 'tape' ),
      Nightmare = require( './nightmare' ),
      nightmare = new Nightmare( {
        show: false
      } );

nightmare.goto( 'http://localhost:3000' );

test( 'modal is open', t => {
  nightmare.refresh()
    .click( '[data-open=".modal1"]' )
    .evaluate( () => {
      return !!document.querySelector( '.modal-wrapper' );
    } )
    .then( is => {
      t.ok( is );
      t.end();
    } );
} );


test( 'modal is closed', t => {
  nightmare.refresh()
    .evaluate( () => {
      return !!document.querySelector( '.modal-wrapper' );
    } )
    .then( isNot => {
      t.notOk( isNot );
      t.end();
    } );
});

test( '-------------------------------', ( t ) => {
  t.comment( 'Test suite done' );
  t.comment( '-------------------------------' );
  nightmare.end()
  .then( () => {
    t.end();
  } );
});

