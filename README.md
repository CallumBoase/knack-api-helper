# KnackAPI
Methods to help work with the Knack API.

## Use in NodeJS:

Install the package
```
$ npm install knack-api-helper --save
```

Use it in your js code
```javascript
const KnackAPI = require('knack-api-helper');

const knackAPI = new KnackAPI({
    auth: 'object-based',
    applicationId: 'YOUR-APPLICATION-ID',
    apiKey: 'YOUR-API-KEY'
});

```
You can also use 'view-based' auth in your server-side environment.
```javascript
const KnackAPI = require('knack-api-helper');

const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
    staticUserToken: 'A-VALID-USER-TOKEN-FOR-YOUR-APP'
});
```

## Use in Browser or Knack javascript code area:

JS file bundled with all needed dependencies, for browser is available via CDNJS
(note only available from version 1.0.0 and higher)
```
https://cdn.jsdelivr.net/npm/knack-api-helper@version/browser.js
```

Load browser.js from a script file

```html
<script src="https://cdn.jsdelivr.net/npm/knack-api-helper@1.1.0/browser.js"></script>
```

Or load it via javascript (eg into the Knack builder Javascript code area)

```javascript

loadJs('https://cdn.jsdelivr.net/npm/knack-api-helper@1.1.0/browser.js');

function loadJs(url){
    var script = document.createElement('script');
    script.src = url;
    script.onload = function(){
        console.log(`loaded ${url}`);
    }
    script.onerror = function(){
        $('.kn-scenes').remove();
        alert(`error loading the app, refresh your page. Error details: unable to load external script ${url}`);
    }
    document.head.appendChild(script);
}
```
Use it in your javascript code after it's loaded
Note: do not use object-based auth in browser code because it exposes your api key!!

Within the Knack builder javascript area (Knack object available on the window)

```javascript
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: Knack.application_id
});
```
Somewhere else in the browser (Knack object not available on the window)
```javascript
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
    staticUserToken: 'A-VALID-USER-TOKEN-FOR-YOUR-APP'
});
```
Within the Knack builder javascript area you can also specify a static user token as per above (if needed)
