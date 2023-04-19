# KnackAPI
Methods to help work with the Knack API.

Looking for the [Changelog](CHANGELOG.md)?

## Installation

### NodeJS

1. Install the package from npm. In a terminal run `npm install knack-api-helper --save`
2. Import the package into your code. 
```js
//example nodejs file
const KnackAPI = require('knack-api-helper');

//Initialise the library from KnackAPI variable
const knackAPI = new KnackAPI....

```

### Browser (including Knack Javascript area)

A javascript file bundled with all needed dependencies for use in the browser is available via CDNJS
(note only available from version 1.0.0 and higher)
```
https://cdn.jsdelivr.net/npm/knack-api-helper@X.X.X/browser.js
```

Build the URL you want to use, replacing `X.X.X` with the version number. An example of a finished URL is:
```
https://cdn.jsdelivr.net/npm/knack-api-helper@2.1.5/browser.js
```

#### Loading into a HTML page

1. Add the `browser.js` file as a script tag in the `head` of your HTML page
```html
<head>
    <script src="https://cdn.jsdelivr.net/npm/knack-api-helper@X.X.X/browser.js"></script>
</head>
```
2. The `KnackAPI` object is now stored in the window object. So, you can add another script tag somewhere in the `body` of your HTML page, to do what you need to do.
```html
<body>
    <script>
        //Initialize then do stuff with KnackAPI
        const knackAPI = new KnackAPI....
    </script>
```
#### Loading into Knack javascript area
1. Import `browser.js` into the Knack javascript area using Javascript. Using [KnackInitAsync](https://docs.knack.com/docs/load-external-javascript-files#loading-js-files-with-event-handlers-from-outside-of-the-builder) prevents the app loading until the external `browser.js` script has loaded
```js
//KnackInitAsync blocks the app loading until callback() is run 
KnackInitAsync = function($, callback) {

    // REQUIRED: Explicitly include jQuery
    window.$ = $;

    const scripts = [
        {src: 'https://cdn.jsdelivr.net/npm/knack-api-helper@X.X.X/browser.js'}
    ]
    loadScripts(
        scripts, 
        (callback) => {
            //Initialize Knack API
            window.knackAPI = new KnackAPI....//Continue initialization code as per below
            //Continue loading the app
            callback()
        }, 
        () => {console.log('error loading scripts')}
    );
}

//Helper function to load scripts into a Knack app
const loadScripts = (scripts, onSuccess, onFailure) => {
    let loadedScripts = 0;
    let failedScripts = 0;

    if(typeof onSuccess !== 'function'){
        onSuccess = function(){
            console.log('Scripts loaded');
        }
    }

    if(typeof onFailure !== 'function'){
        onFailure = function(){
            console.error('Failed to load scripts');
        }
    }

    scripts.forEach(({ src, type }) => {
        const script = document.createElement('script');
        script.src = src;
        if (type) {
            script.type = type;
        }

        script.addEventListener('load', () => {
            loadedScripts++;
            if (loadedScripts === scripts.length) {
                onSuccess();
            }
        });

        script.addEventListener('error', () => {
            failedScripts++;
            onFailure();
        });

        document.body.appendChild(script);
    });
};

```

## Initialization
Once you have imported `knack-api-helper as KnackAPI` via one of the above messages, you're ready to use it.

The first step is to initialize a new instance from the KnackAPI class. This can be done in one of two ways, depending what sort of authentication you want to use.

### Object-based authentication
```javascript
const knackAPI = new KnackAPI({
    auth: 'object-based',
    applicationId: 'YOUR-APPLICATION-ID',
    apiKey: 'YOUR-API-KEY'
});
```
> Warning! Do not use object-based authentication in client-side code (including the Knack javascript area), because it exposes your api key.

### View-based authentication

The basic way to initialize with view-based authentication is as follows. This will operate with the permissions of public users, rather than logged in users, so only API calls to views on public scenes will work.

```javascript
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID'
});
```
#### Providing a user token directly to the knackAPI instance
If you're running your code in the Knack javascript area, you use the built-in Knack method `window.Knack.getUserToken` to obtain a user token for the currently logged in user. Therefore, you could initialize knackAPI like so:
```javascript
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
    userToken: Knack.getUserToken()
});
```

#### Remote login
If you are not running your code in the Knack javascript area, you won't have access to `window.Knack.getUserToken()`. Thereore, we'll need to do a remote login to obtain a user token. This can be done as follows:

```javascript
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
> Warning! Do not use remote login in client-side code (including the Knack javascript area), because it exposes your email and password.

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

##

### .get()
This gets a single record from the Knack api, based on the specified record ID.
```js
const KnackAPI = require('knack-api-helper');

async function run(){
    const knackAPI = new KnackAPI({

    })
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

## getMany (object-based authentication)
(partially written)
### Parameters of getMany request
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

### Example getMany request (object based authentication)

```javascript

const knackAPI = new KnackAPI({
    auth: 'object-based',
    applicationId: 'your application ID',
    apiKey: 'your API key'
});

//object_1 has 20,000 records available

const response = await knackAPI.getMany({
    object: 'object_1',
    format: 'raw',
    rowsPerPage: 500,
    startAtPage: 5,//Skip the first 2000 records (ie 500 records per page * 4 pages skipped = 2000)
    maxRecordsToGet: 3000
});

console.log(response.records);
//Expected output: an array of 3000 records from object_1, contianing only the raw field data

```
