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

Working on views with non-login protected pages (no user token required):
```javascript
const KnackAPI = require('knack-api-helper');

const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID'
});
```
Working on views that are login protected: obtain user token via a remote login to Knack.
```javascript
const KnackAPI = require('knack-api-helper');

const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
});

//Now we remotely login to Knack to obtain a user token & append it to knackAPI
try {
    await knackAPI.login({
        email: 'a_valid_login@email.com',
        password: 'A-VALID-PASSWORD'
    });
} catch(err){
    console.log(err);
}
```

You can also obtain a user token using some other method, and specify it for view-based auth:
```javascript
const KnackAPI = require('knack-api-helper');

const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
    userToken: 'A-VALID-USER-TOKEN-FOR-YOUR-APP'
});
```

## Use in Browser or Knack javascript code area:

JS file bundled with all needed dependencies, for browser is available via CDNJS
(note only available from version 1.0.0 and higher)
```
https://cdn.jsdelivr.net/npm/knack-api-helper@version/browser.js
```

Load browser.js from a script file (replace X.X.X with a version number)

```html
<script src="https://cdn.jsdelivr.net/npm/knack-api-helper@X.X.X/browser.js"></script>
```

Or load it via javascript (eg into the Knack builder Javascript code area)

```javascript

loadJs('https://cdn.jsdelivr.net/npm/knack-api-helper@X.X.X/browser.js');

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
Warning: do not use object-based auth in browser code because it exposes your api key 
Warning: do not hard-code email or password into browser code for remote-login (.login() or .remoteLogin() functions), because it exposes your email/password combination

Using within the Knack builder javascript area (Knack object available on the window)

```javascript
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: Knack.application_id,
    userToken: Knack.getUserToken()
});
```
Somewhere else in the browser (Knack object not available on the window)
```javascript
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
    userToken: 'A-VALID-USER-TOKEN-FOR-YOUR-APP'
});
```
## METHODS
(Partially written)

### .login()
Remote login when using view-based authentication.
Automatically adds the obtained user token to the knackAPI object for use in future requests.
Returns the obtained user token.

| Argument parameter | Details  |
| ---                | ---      |
| email              | string. An email address for a user in your Knack app |
| password           | string. The password for the above user |

```javascript
try {
    await knackAPI.login({
        email: 'a_valid_login@email.com',
        password: 'A-VALID-PASSWORD'
    });
} catch(err){
    console.log(err);
}
```
### .remoteLogin()
Standalone method for remote login to a Knack app
Returns the full request object, rather than just the token.
Does NOT add the user token to your knackAPI object.

| Argument parameter | Details  |
| ---                | ---      |
| email              | string. An email address for a user in your Knack app |
| password           | string. The password for the above user |

```javascript
try {
    const login = await knackAPI.remoteLogin({
        email: 'a_valid_login@email.com',
        password: 'A-VALID-PASSWORD'
    });
    const session = login.json.session;
    console.log(session);
} catch(err){
    console.log(err);
}
```
