# AcceDe Web - overlay

WAI-ARIA overlay plugin without dependencies.

This plugin is written in ES2015 and available either in uncompiled form in the `/lib` folder or compiled for ES5 in the `/dist` folder. If your project uses babel with Webpack or Rollup, you should change the exclusion so this plugin gets compiled or force Webpack or Rollup to fetch the compiled version by using the `main` entry of the `package.json` file instead of the `module` entry.

```js
// .babelrc file or configuration within webpack or rollup
{
  "plugins": [...],
  "exclude": "node_modules/!(@accede-web)/**",
}
```

## Installation

```bash
$ npm install @accede-web/overlay
```

## Methods

| Name                  | Description |
|-----------------------|-------------|
| `show()`                                   | Switch the `aria-hidden` attribute to `false` and disable the rest of the document (if the `modal` parameter is not set to `false`) |
| `close( returnValue )`                     | Switch the `aria-hidden` attribute to `true` and enable the rest of the document if needed. Dispatch `close` event on the overlay. Also available on the root element of the overlay. The `returnValue` property can be sent invoking this method |
| `addEventListener(eventName, callback)`    | Shortcut to listen to the `close` or `cancel` events |
| `removeEventListener(eventName, callback)` | Shortcut to stop listening to the `close` or `cancel` events |

## Properties
| Name                  | Description |
|-----------------------|-------------|
| `el`                  | The HTML root element of the overlay |
| `returnValue`         | Also available on the HTML root element. Allows you to pass data between the overlay and the document |

## Static properties

Contrary to the instance's properties, the static properties are available on the constructor.

| Name                  | Description |
|-----------------------|-------------|
| `stack`               | Pending overlay stack. Array of all the overlays currently open |

## Events
| Name                  | Description |
|-----------------------|-------------|
| `close`               | Triggered when the method `.close()` is called |
| `cancel`              | Triggered when the parameter `closeOnCancel` is `true` and an escape key keydown or a click outside the overlay is happening. Can be prevented with `event.preventDefault()`. Triggers a `close` event when not prevented |

## Inserting an element in an overlay

### HTML
```html
<!-- content to be insterted in an overlay -->
<section class="overlay">
  <header class="layer-header">
    <button class="button-close">
      <span>Close</span>
    </button>
    <h2 class="layer-title">Modal window</h2>
  </header>
  <div class="layer-content">
    <p>…</p>
  </div>
</section>
```

### JavaScript

```js
// the content property can be an HTMLElement
var overlay = new Overlay({
  content: document.querySelector( '.overlay' )
});

// … or an HTML string
var overlay = new Overlay({
  content: '<div><p>Hello</p></div>'
});

overlay.addEventListener( 'close', e => {
  // the value returned by the overlay
  console.log( e.target.returnValue );
});

// Display the overlay
overlay.show();

// Close the overlay and pass the return value
overlay.close( 'returnValueData' );
```

### Parameters

#### Mandatory parameters

| Name            | Type                          | Description |
|-----------------|-------------------------------|-------------|
| `content`       | `HTMLElement` or `String` | Content to insert in the overlay. |

#### Optional parameters

| Name            | Type          | Description |
|-----------------|---------------|-------------|
| `className`     | `String`      | HTML classes to add to the overlay (space separated) |
| `closeOnCancel` | `Boolean`     | Allow the Escape key or a click outside the overlay to close it. Defaults to `true` |
| `closeSelector` | `String`      | CSS selector to match any element that will close the overlay when clicked |
| `modal`         | `Boolean`     | Should the overlay be modal (disable anything but the overlay on the page). Defaults to `true` |
| `opener`        | `HTMLElement` | HTML element that will receive the focus once the overlay is closed. Defaults to the current active element |
| `tagName`       | `String`      | Change the tag name of the overlay. Defaults to `<div>` |
| `role`          | `String`      | Specify the role attribute of the overlay. Can be `dialog` or `alertdialog` |
| `titleSelector` | `String`      | Mandatory when using a `role` attribute and no `label` property, a CSS selector matching the title the overlay should have. Defaults to `[data-label]` |
| `label`         | `String`      | Mandatory when using a `role` attribute and there's no title displayed in the overlay to specify the title of the overlay |

## Passing the formated overlay

In this case the overlay is a valid and accessible HTML structure passed to the script. The script is used to handle the events and to disable the document.

### HTML

```html
<!-- valid overlay structure example -->
<div role="alertdialog" class="layer" aria-hidden="true" aria-labelledby="layerTitle" aria-describedby="layerDesc">
  <section class="layer">
    <header class="layer-header">
      <button class="button-close">
        <span>Close</span>
      </button>
      <h2 class="layer-title" id="layerTitle">Warning</h2>
    </header>
    <div class="layer-content">
      <p id="layerDesc">Your confirmation number is required before continuing.</p>
    </div>
  </section>
</div>
```

### JavaScript

```js
var overlay = new Overlay( document.querySelector( '.layer' ), {
  closeOnCancel: false,
  opener: document.querySelector( 'button' ),
  closeSelector, '.button-close'
  modal: false
});

// Display the overlay
overlay.show();

// Close the overlay
overlay.close();
```

### Optional parameters

| Name            | Type          | Description |
|-----------------|---------------|-------------|
| `closeOnCancel` | `Boolean`     | Allow the Escape key or a click outside the overlay to close it. Defaults to `true` |
| `closeSelector` | `String`      | CSS selector to match any element that will close the overlay when clicked |
| `modal`         | `Boolean`     | Should the overlay be modal (disable anything but the overlay on the page). Defaults to `true` |
| `opener`        | `HTMLElement` | HTML element that will receive the focus once the overlay is closed. Defaults to the current active element |


## Keyboard Interaction
* `Tab`: Moves focus to the next tabbable element inside the overlay.
* `Shift + Tab`: Moves focus to the previous tabbable element inside the overlay.
* `Escape`: Closes the overlay.

## Polyfill

In order to dispatch the `close` and `cancel` event, the script uses the `CustomEvent` constructor. A polyfill for `CustomEvent` is mandatory when the support of Internet Explorer is required. You can find one on the [MDN website](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill).

## Compatibilty
This plugin is tested against the following browsers:

* Internet Explorer 11 and higher
* Microsoft Edge
* Chrome
* Firefox
* Safari

## Testing

Install the project dependencies:

```bash
  $ npm install
```

Run the automated test cases:

```bash
  $ npm test
```
