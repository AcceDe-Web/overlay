/* eslint-env node */
'use strict';

const test = require( 'tape' );
const puppeteer = require( 'puppeteer' );
const path = `file://${__dirname}/index.html`;

const createBrowser = async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();

  await page.goto( path );

  return [ browser, page ];
};

test( 'Ouverture de dialog', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal4"]' );
  await page.waitFor( 20 );

  const [ ariaHidden, interactiveElIsFocused, disabled, hidden, role, labelMatch ] = await page.evaluate(() => {
    const modal = document.querySelector( '.modal-wrapper' );

    const interactiveEl = document.querySelectorAll( '.modal-wrapper button' );
    // skip the first button which is the close button
    const interactiveElIsFocused = interactiveEl[1] === document.activeElement;


    const interactiveEls = Array.from( document.querySelectorAll( 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contenteditable]' ) );

    const disabled = interactiveEls.every( el => {
      // skip interactive elements contained in the modal
      if( modal.contains( el ) ){
        return true;
      }

      return el.tabIndex < 0;
    } );

    const bodyChildren = Array.from( document.body.children );

    const hidden = bodyChildren.every( el => {
      // skip the modal and script tags
      if( modal === el || 'SCRIPT' === el.nodeName  ){
        return true;
      }

      return el.getAttribute( 'aria-hidden' ) === 'true';
    } );

    const role = modal.getAttribute('role');

    const title = modal.querySelector( '[data-label]' );
    const labelMatch = modal.getAttribute('aria-labelledby') === title.id;


    return [
      modal.getAttribute('aria-hidden'),
      interactiveElIsFocused,
      disabled,
      hidden,
      role,
      labelMatch
    ]

  });

  t.same( ariaHidden, 'false', 'L’attribut « aria-hidden » du conteneur de la modale a la valeur « false ».' );
  t.true( interactiveElIsFocused, 'Le focus clavier est positionné sur le premier élément interactif de la modale (hors bouton de fermeture).');
  t.true( disabled, 'La totalité des éléments interactifs hors de la modale sont désactivés via « tabindex="-1" ».');
  t.true( hidden, 'La totalité de la page en arrière-plan n’est plus lisible via « aria-hidden="true" ».');
  t.true( role, 'dialog', 'Le conteneur de la modale doit avoir la valeur « dialog » pour l’attribut « role ».');
  t.true( labelMatch, '« aria-labelledby » a la même valeur que l’identifiant du titre de la popin.' );

  await browser.close();

  t.end();
});

test( 'Ouverture de dialog (sans éléments interactifs)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal6"]' );

  const interactiveElIsFocused = await page.evaluate(() => {
    var interactiveEl = document.querySelector( '.modal-wrapper .close' );
    // skip the first button which is the close button
    return interactiveEl === document.activeElement;
  })

  t.true( interactiveElIsFocused, 'Le focus clavier se positionne sur le premier bouton de fermeture s’il n’y a pas d’autre éléments interactifs.' );

  await browser.close();

  t.end();
});

test( 'Ouverture de dialog (sans titre visible)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal7"]' );

  const ariaLabel = await page.evaluate(() => {
    const modalOpener = document.querySelector( '[data-open=".modal7"]' );
    const modal = modalOpener.modal.el;
    const ariaLabel = modal.getAttribute( 'aria-label' );

      return ariaLabel && ariaLabel.trim().length > 0;
  })

  t.same( ariaLabel, true, 'Le conteneur doit avoir un attribut « aria-label » non vide.' );

  await browser.close();

  t.end();
});

test( 'Ouverture de dialog (sans titre ni « aria-label »)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal8"]' );

  const hasModal = await page.evaluate(() => {
    const modalOpener = document.querySelector( '[data-open=".modal8"]' );

    return modalOpener.modal;
  })

  t.same( hasModal, undefined, 'La fenêtre de dialog ne s’affiche pas' );

  await browser.close();

  t.end();
});

test( 'Fermeture de dialog (Echap)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal4"]' );
  await page.keyboard.press( 'Escape' );
  await page.waitFor( 20 );

  const closed = await page  .evaluate(() => {
    let modal = document.querySelector( '.modal-wrapper' );

    return modal.getAttribute('aria-hidden') === 'true';
  });

  t.true( closed, 'La touche « Echap » permet de fermer la modale.' );

  await browser.close();

  t.end();
});

test( 'Fermeture de dialog (click extérieur)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal4"]' );
  await page.waitFor( 5 );
  await page.mouse.click( 5, 5 );
  await page.waitFor( 20 );

  const closed = await page.evaluate(() => {
    let modal = document.querySelector( '.modal-wrapper' );

    return modal.getAttribute('aria-hidden') === 'true';
  });

  t.true( closed, 'Un clic en dehors du contenu de la modale ferme la modale.' );

  await browser.close();

  t.end();
});

test( 'Fermeture de dialog (bouton de fermeture)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal4"]' );
  await page.click( '.modal-wrapper .close' );
  await page.waitFor( 20 );

  const closed = await page  .evaluate(() => {
    let modal = document.querySelector( '.modal-wrapper' );

    return modal.getAttribute('aria-hidden') === 'true';
  });

  t.true( closed, 'Un clic sur un bouton de fermeture ferme la modale.' );

  await browser.close();

  t.end();
});


test( 'Fermeture de dialog (click intérieur)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal4"]' );
  await page.click( '.modal-wrapper .modal.modal4' );
  await page.waitFor( 20 );

  const opened = await page  .evaluate(() => {
    let modal = document.querySelector( '.modal-wrapper' );

    return modal.getAttribute('aria-hidden') === 'false';
  });

  t.true( opened, 'Un clic dans le contenu de la modal ne ferme pas la modale.' );

  await browser.close();

  t.end();
});

test( 'Fermeture de dialog', async t => {
  const [ browser, page ] = await createBrowser();

  await page.evaluate(() => {
    window.interactiveEls = Array.from( document.querySelectorAll( 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contenteditable]' ) );

    window.interactiveEls.forEach( el => {
      el.testIndex = el.tabIndex;
    });

  })

  await page.click( '[data-open=".modal4"]' );
  await page.keyboard.press( 'Escape' );
  await page.waitFor( 20 );

  const [ enabled, visible, hidden, focused ] = await page  .evaluate(() => {
    const enabled = window.interactiveEls.every( el => {
      return el.testIndex === el.tabIndex;
    } );

    const bodyChildren = Array.from( document.body.children );

    const visible = bodyChildren.every( el => {
      const isModal = el.classList.contains('modal-wrapper');
      return ( isModal && el.getAttribute( 'aria-hidden' ) === 'true' )
          || ( !isModal && !el.hasAttribute( 'aria-hidden' ))
          || ( !isModal && el.getAttribute( 'aria-hidden' ) === 'false' );
    });

    const modalOpener = document.querySelector( '[data-open=".modal4"]' );
    const hidden = modalOpener.modal.el.getAttribute( 'aria-hidden' ) === 'true';

    const focused = document.activeElement === document.querySelector( '[data-open=".modal4"]' );

    return [
      enabled,
      visible,
      hidden,
      focused
    ]
  });

  t.true( enabled, 'La totalité des éléments interactifs hors de la modale sont réactivés.' );
  t.true( visible, 'La totalité de la page en arrière-plan est lisible.' );
  t.true( hidden, 'La modale doit avoir la valeur « true » pour l’attribut « aria-hidden ».' );
  t.true( hidden, 'Le focus est placé sur l’élément interactif déclencheur de l’ouverture.' );

  await browser.close();

  t.end();
});

test( 'Fermeture de alertdialog (Echap)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal10"]' );
  await page.keyboard.press( 'Escape' );
  await page.waitFor( 20 );

  const closed = await page  .evaluate(() => {
    let modal = document.querySelector( '.modal-wrapper' );

    return modal.getAttribute('aria-hidden') === 'false';
  });

  t.true( closed, 'La touche « Echap » ne permet pas de fermer la modale « alertdialog ».' );

  await browser.close();

  t.end();
});

test( 'Fermeture de alertdialog (click extérieur)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal10"]' );
  await page.waitFor( 5 );
  await page.mouse.click( 5, 5 );
  await page.waitFor( 20 );

  const closed = await page.evaluate(() => {
    let modal = document.querySelector( '.modal-wrapper' );

    return modal.getAttribute('aria-hidden') === 'false';
  });

  t.true( closed, 'Un clic en dehors du contenu ne permet pas de fermer la modale « alertdialog ».' );

  await browser.close();

  t.end();
});

test( 'Fermeture de alertdialog (bouton de fermeture)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal10"]' );
  await page.click( '.modal-wrapper .close' );
  await page.waitFor( 20 );

  const closed = await page  .evaluate(() => {
    let modal = document.querySelector( '.modal-wrapper' );

    return modal.getAttribute('aria-hidden') === 'true';
  });

  t.true( closed, 'Un clic sur un bouton de fermeture ferme la modale « alertdialog ».' );

  await browser.close();

  t.end();
});

test( 'Fermeture de alertdialog (click intérieur)', async t => {
  const [ browser, page ] = await createBrowser();

  await page.click( '[data-open=".modal10"]' );
  await page.click( '.modal-wrapper .modal.modal10' );
  await page.waitFor( 20 );

  const opened = await page  .evaluate(() => {
    let modal = document.querySelector( '.modal-wrapper' );

    return modal.getAttribute('aria-hidden') === 'false';
  });

  t.true( opened, 'Un clic dans le contenu de la modal ne ferme pas la modale « alertdialog ».' );

  await browser.close();

  t.end();
});
