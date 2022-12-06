# KnackAPI
Methods to help work with the Knack API.

Looking for the [Changelog](CHANGELOG.md)?

# Use in NodeJS:

Install the package
```
$ npm install knack-api-helper --save
```

**Use it in your js code with object-based authentication**
```javascript
const KnackAPI = require('knack-api-helper');

const knackAPI = new KnackAPI({
    auth: 'object-based',
    applicationId: 'YOUR-APPLICATION-ID',
    apiKey: 'YOUR-API-KEY'
});

```
You can also use 'view-based' auth in your server-side environment.

**Initialising view-based auth without a user token, to work on views on public pages:**
```javascript
const KnackAPI = require('knack-api-helper');

const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID'
});
```

**Initialising then remotely logging in to obtain user token, to work on views on login-protected pages:**
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

**Initialising view-based auth with a static user token value from some other source:**
```javascript
const KnackAPI = require('knack-api-helper');

const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
    userToken: 'A-VALID-USER-TOKEN-FOR-YOUR-APP'
});
```

# Use in Browser or Knack javascript code area:

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
Using it in your javascript code after it's loaded

*Warning: do not use object-based auth in browser code because it exposes your api key*

*Warning: do not hard-code email or password into browser code for remote-login (.login() or .remoteLogin() functions), because it exposes your email/password combination*

**Using in the Knack builder javascript area (Knack object available on the window):**

```javascript
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: Knack.application_id,
    userToken: Knack.getUserToken()
});
```
**Using in other browser-based code (Knack object not available on the window):**
```javascript
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
    userToken: 'A-VALID-USER-TOKEN-FOR-YOUR-APP'
});
```
# GENERAL BEHAVIOUR
*(Partially written)*

**Auto-retry and delay between retries**

knack-api-helper will auto-retry failed API calls when sensible, but will return an error immediately if the error is permanent.

| Http error code | Auto-retry? | Delay between retries | Details |
| --- | --- | --- | --- |
| 4XX (except 429) | No | N/A | These codes are related to invalid authentication so there is no point retrying failed requests. | 
| 429 | Yes | Exponential backoff | This code occurs when you make more than 10 requests per second to the Knack API. Retry is sensible, and exponential backoff is recommended by Knack API documentation, so we do that. |
| 5XX | Yes | 1 second (static) | These codes are related to temporary server outages or similar. Retrying is sensible, but there's no need to use exponential backoff, so we keep things faster by just waiting 1 second and retrying. |

# KNACK-API-HELPER METHODS
*(Partially written)*

## .login()
Performs a [remote login](https://docs.knack.com/docs/remote-user-logins) when using view-based authentication.

Automatically adds the obtained user token to the knackAPI object for use in future requests.

Returns the obtained [user token](https://docs.knack.com/docs/user-tokens) (string).

Pass .login() a settings object with these parameters:

| Parameter | Type | Required? | Details  |
| ---                | ---  | ---       | ---      |
| email              | string | Yes | An email address for a user in your Knack app |
| password           | string | Yes | The password for the above user |

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
## .remoteLogin()
Standalone method for [remote login](https://docs.knack.com/docs/remote-user-logins) to a Knack app.

Returns the full request object (data for the [Knack user session](https://docs.knack.com/docs/remote-user-logins)), rather than just the token.

Does **NOT** add the user token to your knackAPI object.

Pass .remoteLogin() a settings object with these parameters:

| Parameter | Type | Required? | Details  |
| ---                | ---  | ---       | ---      |
| email              | string | Yes | An email address for a user in your Knack app |
| password           | string | Yes | The password for the above user |

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

## post/put/delete.many() example
(Partially written)

Example many request with error handling individual errors

This will auto-retry as per default settings just like a single request

```javascript

try {

    const knackAPI = new KnackAPI({
        auth: 'view-based',
        applicationId: 'YOUR-APPLICATION-ID'
    });

    await knackAPI.login({
        email: 'email@email.com',
        password: 'password'
    });

    const records = [
        {field_22: 'some data 1'},
        {field_22: 'some data 2'},
        {field_22: 'some data 3'},
        {field_22: 'some data 4'},
        {field_22: 'some data 5'},
        {field_22: 'some data 6'},
    ]

    const responses = await knackAPI.postMany({
        scene: 'scene_106',
        view: 'view_269',
        records,
    });

    if(responses.summary.rejected > 0){
        res.summary.errors.forEach(err => {
            errorHandler(err.reason);
        })
    }

} catch(err){
    //To catch errors from knackAPI.login()
    //ERrors from .postMany() will not reach here
    console.log(err)
}

```

## getMany example (object-based authentication)
(partially written)
**Parameters**
These are available in both ob
| Parameter | Auth-type | Type | Required? | Details  |
| ---                | --- | ---  | ---       | ---      |
| object             | object-based |string | Yes | The object to get all records for |
| scene             | view-based |string | Yes | Scene key of scene containing view we are getting data from |
| view             | view-based |string | Yes | View key of the view we are getting data from |
| filters            | object or view-based |Filters object | No | A javascript object version of <a href="https://docs.knack.com/docs/constructing-filters">Knack filter object</a>|
| format             | object or view-based | string | No | Knack API call <a href="https://docs.knack.com/docs/formatting">formatting options</a> (```raw```, ```both```, or ```html```) |
| rowsPerPage |  object or view-based | integar | No. Defaults to 1000 if not provided. | How many records to get per page of data. See <a href="https://docs.knack.com/docs/pagination">pagination Knack docs</a> |
| startAtPage | object or view-based | integar | No. Defaults to 1 if not provided | The first page of data to get. Knack-api-helper will fetch this page of data, then any subsequent pages in order (page 1,2,3,4 etc) until all records are fetched or until it has fetched the ```maxRecordsToGet``` number of records (see below).<br> E.g., if there are 10000 records available and you set ```startAtPage: 5``` (and leave ```rowsPerPage``` and ```maxRecordsToGet``` at their default values), knack-api-helper will fetch pages 5-10, so you will receive the last 5000 records of the available 10000. |
| maxRecordsToGet | object or view-based | integar | No. Defaults to all records if not provided. | The maximum number of records to get. E.g., if you set this to 1500, and there are 30,000 records available, only the first 1500 records will be fetched.<br>Knack-api-helper will fetch pages in order, it will not go "backwards" to earlier pages to fetch additional records. E.g., if a Knack object has only 2000 records and you set ```startAtPage: 2``` and ```maxRecordsToGet: 1500```, the first 1000 records will be skipped and you will only get the final 1000 records (not 1500). |
| other parameters   | object or view-based | Various | No | There are some other parameters available including helperData and more, but these are not yet documented.|

```javascript

const knackAPI = new KnackAPI({
    auth: 'object-based',
    applicationId: 'your application ID',
    apiKey: 'your API key'
});

const response = await knackAPI.getMany({
    object: 'object_1',
    format: 'raw',//Optional parameter to make use of Knack API call formatting options
});

console.log(responses.records);

```
