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
const knackAPI = new KnackAPI({
    applicationId: 'YOUR-APPLICATION-ID',
    auth: 'view-based'
});

//Use knackAPI as needed from here.

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
        //Initialise the library from KnackAPI variable, and store it in the window object
        window.knackAPI = new KnackAPI({
            applicationId: 'YOUR-APPLICATION-ID',
            auth: 'view-based'
        });

        //Use knackAPI as needed from here.
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
        callback,
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

## Easiest way to use knack-api-helper within Knack javascript code

### `makeRequest()`
This is the easiest way to use knack-api-helper but only works if you're writing code in the Knack javascript area (or in a browser environment where the window.Knack object is available eg due to an embedded Knack app).

#### Parameters
|Parameter|Type|Required?|Details|
|---|---|---|---|
|method|string|Yes|The method to run. Currently supported are `get`, `getMany`, `post`, `postMany`, `put`, `putMany`, `delete`, `deleteMany`|
|options|object|Yes|The options required for the method being run (see detailed documentation below)|
|isPublic|boolean|No|Whether the request is being run on a publicly accessible view or not. If set to true, `knack-api-helper` will be initialised without a user token and will therefore only work on public views. If you leave this undefined or set it to false, `knack-api-helper` will be initialised with a user token and will work on login-protected views if there is a logged in user with the appropriate permissions.|

#### Example of `makeRequest()`

```javascript
// Excerpt from code written in the Knack javascript area

// Make sure knack-api-helper has been imported already (see documentation above)
// Unlike all other methods, you don't need to initialise knack-api-helper to run `makeRequest`
// You can just use it immediately and knack-api-helper will get the application id and user token from the window.Knack object where relevant

//Use makeRequest to get many records from view_26 in scene_10
$(document).on('knack-view-render.view_1', asybc function(event, view, records) {
    try {
        const records = await KnackAPI.makeRequest('getMany', {
            scene: 'scene_10',
            view: 'view_26',
            format: 'raw'
        })
        console.log(records);
    } catch(err){
        //If an error occurs (including one or more postMany, putMany or deleteMany requests failing)
        //makeKnackApiRequest will throw an error which can be caught via a try catch block
        console.log(err);
    }
})

```
# Full Knack API usage documentation
The instructions below are an alternative to using `makeRequest()` and are useful for more control over how `knack-api-helper` is used, or if you're not running code in the Knack javascript area.

## Initialization
Once you have imported `knack-api-helper as KnackAPI` via one of the above methods, you're ready to use it.

The first step is to initialize a new instance from the KnackAPI class. This can be done in one of two ways, depending what sort of authentication you want to use.

### Object-based authentication
```javascript
//Server-side javascript code (eg Node.js)
const knackAPI = new KnackAPI({
    auth: 'object-based',
    applicationId: 'YOUR-APPLICATION-ID',
    apiKey: 'YOUR-API-KEY'
});
```
> Warning! Do not use object-based authentication in client-side code (including the Knack javascript area), because it exposes your api key.

### View-based authentication

#### Public (non-authenticated) user
The basic way to initialize with view-based authentication is as follows. This will operate with the permissions of public users, rather than logged in users, so only API calls to views on public scenes will work.

This can be safely used in any client-side or server-side code, including the Knack javascript area.

```javascript
//Client or server-side javascript code
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID'
});
```
#### Authenticated users
If you want to make view-based API calls to login-protected pages, you'll need to provide a user token to Knack-Api-Helper. How you do this depends where you're running your code.

##### In the Knack javascript area
If you're running your code in the Knack builder javascript area, you can use the built-in Knack method `window.Knack.getUserToken()` to obtain a user token for the currently logged in user. Therefore, you could initialize knackAPI like so:
```javascript
//Javascript running in Knack javascript area
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
    userToken: Knack.getUserToken()
});
```

##### Outside of the Knack javascript area
If you want to use view-based authentication outside of the Knack javascript area (but still need to access login-protected pages) you won't have access to `window.Knack.getUserToken()`. 

Therefore, you'll need to do a remote login to obtain a user token and append it to the `knackAPI` instance. See the [API reference -> remote login](#remote-login) section below for more information.

> Warning, do not include a username and password in code that is running client-side, including the Knack javascript area, because it exposes your username and password to the public!

# GENERAL BEHAVIOUR
This sections outlines the general behaviour of Knack-Api-Helper and how it handles errors.

## Auto-retry and delay between retries

knack-api-helper will auto-retry failed API calls when sensible, but will return an error immediately if the error is permanent.

| Http error code | Auto-retry? | Delay between retries | Details |
| --- | --- | --- | --- |
| 4XX (except 429) | No | N/A | These codes are related to invalid authentication so there is no point retrying failed requests. | 
| 429 | Yes | Exponential backoff | This code occurs when you make more than 10 requests per second to the Knack API. Retry is sensible, and exponential backoff is recommended by Knack API documentation, so we do that. |
| 5XX | Yes | 1 second (static) | These codes are related to temporary server outages or similar. Retrying is sensible, but there's no need to use exponential backoff, so we keep things faster by just waiting 1 second and retrying. |

# API REFERENCE

## Remote login
Remote login is useful when:
* You want to use view-based authentication to make API calls to login-protected pages (see [initializing](#Initialization) above)
* `window.Knack.getUserToken()` is not available to you because you're running code somewhere outside of the Knack javascript area

Knack provides a [remote login](https://docs.knack.com/docs/remote-user-logins) method to perform a remote login to obtain a user token to authenticate view-based API calls. Knack-api-helper provides the following methods that make use of this.

> Warning! Do not use remote login in any client-side code (including the Knack javascript area), because it xposes your email and password to the public!

### .login()
Performs a [remote login](https://docs.knack.com/docs/remote-user-logins) and appends the returned user token to the `knackAPI` instance to authenticate future view-based API calls.

The function also returns the obtained [user token](https://docs.knack.com/docs/user-tokens) (JWT string generated by Knack) in case you want to use it elsewhere in your code.

Pass .login() a settings object with these parameters:

| Parameter | Type | Required? | Details  |
| ---                | ---  | ---       | ---      |
| email              | string | Yes | An email address for a user in your Knack app |
| password           | string | Yes | The password for the above user |

Example:

```javascript
//Server-side javascript (eg Node.js code)

//Initialize without a user token
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

    //Now you can run knackAPI methods authenticated as the user you logged in as!

} catch(err){
    console.log(err);
}
```
### .remoteLogin()
This is a standalone method for [remote login](https://docs.knack.com/docs/remote-user-logins) to a Knack app.

Returns the full request object (data for the [Knack user session](https://docs.knack.com/docs/remote-user-logins)), rather than just the token.

Does **NOT** add the user token to your knackAPI object.

Pass .remoteLogin() a settings object with these parameters:

| Parameter | Type | Required? | Details  |
| ---                | ---  | ---       | ---      |
| email              | string | Yes | An email address for a user in your Knack app |
| password           | string | Yes | The password for the above user |

```javascript
//Server-side javascript (eg Node.js code)

//Initialize without a user token
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: 'YOUR-APPLICATION-ID',
});

//Remote login to obtain full session object
try {
    const login = await knackAPI.remoteLogin({
        email: 'a_valid_login@email.com',
        password: 'A-VALID-PASSWORD'
    });
    const session = login.json.session;
    console.log(session);

    //Note that your knackAPI instance will NOT have the user token appended to it

} catch(err){
    console.log(err);
}
```

## Validating a User Token - validateSession()
This method lets you validate that a Knack user token is valid and current for the specified app. 

This is useful in a few scenarios:
* You want to check if a user token expressly provided to knack-api-helper is valid before using it to make view-based API calls (avoiding potential failure of API calls later on)
* You are using Knack-api-helper in server-side code that is triggered via a http request from a Knack app. You want to ensure that a logged in Knack user initiated the http request before running other logic (eg before running server-side object-based API calls).

Behaviour
* Checks that there is a valid session for the applicationId that you initialised Knack-api-helper with
* Session is considered valid if all of these are true:
    * The http request to `https://api.knack.com/v1/session/token` succeeds
    * A session object is returned
    * The `session.status` is 'active'
    * The `session.user.account_status` is 'active' (ie the user is listed as 'active' in the Knack user table, rather than 'inactive' or 'pending approval')
    * The `session.user.approval_status` is 'approved'
    * If a `userRoleCheck` parameter is provided, the user is a member of the specified user role (`session.user.profileKeys` includes the specified `profile_key`)
* Return: `true` (session is valid) or `false` (session is not valid)

Pass `validateSession()` a settings object with these parameters:

| Parameter | Type | Required? | Details  |
| ---                | ---  | ---       | ---      |
| userToken          | string | Yes | A Knack user token string |
| userRoleCheck      | string | No | An optional (single) user role that you want to check membership of eg `profile_10`. This corresponds to the object_key (eg object_10) of the user role object you want to check membership of |\

Example usage
```javascript
//Initialise knack-api-helper
const knackAPI = new KnackAPI({
    auth: "view-based",//Could also initialise as object-based
    applicationId: "YOUR-APPLICATION-ID",
    //Could also initialise with a user token if desired
});

//Check that a user token is valid for the Knack app
const isAuthorized = await knackAPI.validateSession({
    userRoleCheck: 'profile_17',//The role you want to check for membership of (optional)
    userToken: 'SOME_KNACK_USER_TOKEN'
});

console.log(isAuthorized);//expected value: true or false

if(!isAuthorized){
    return;//Stop executing your code
} else {
    //Continue running your code
}
```

## Standard CRUD API calls

There are 8 types of API calls supported by knack-api-helper, for standard CRUD (Create, read, update, delete) of records in your Knack database. These are:
* `get` 
* `getMany`
* `post`
* `postMany`
* `put`
* `putMany`
* `delete`
* `deleteMany`

### Common parameters for Standard CRUD API calls
All the standard CRUD API calls share these common parameters.

| Parameter | Type | Required? | Auth type applies to | Details  |
| --- | --- | --- | --- | --- |
| view | string | When using view-based | View-based only | The view to use for making the view-based API call eg `view_10` |
| scene     | string | When using view-based | View-based only | The scene containing the view used to make the view-based API call eg `scene_25` |
| object | string | When using object-based | Object-based only | The object (database table) we are making the API call to eg `object_1` |
| helperData | object | No | Both | Any arbritrary object you want to include with the API call. This will get returned to you when you receive the response to the API call.<br><br> Useful for tracking data about the request that wouldn't ordinarily be easy to understand from the data received back from the API call. |
| retries | integar >= 0 | No | Both | The number of times to retry the API call/s on failure, if the error code indicates that a retry might fix the error ([see above](#auto-retry-and-delay-between-retries)). Defaults to 5 if no value is provided. <br><br> Note there is a current issue: customizing the amount of retries doesn't work for `getMany`. `getMany` will always retry 5 times. |

Additional parameters are also available for specific API calls. These are documented in the relevant sections below (see [API Reference](#api-reference)).

### get (single)
This gets a single record from the Knack api, based on the specified record ID.

#### get example
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

    const response = await knackAPI.get({
        scene: 'scene_9',
        view: 'view_20',//View_20 is a details, grid, search or other view showing a record
        recordId: '62e1e6b8754ba000219b0d83'
    });

    const record = response.json;
    console.log(record)//Expected output: a javascript object representing the Knack record

} catch(err) {
    console.log(err);
}
```

### post (single)
Create a single record.

#### post example
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

    const response = await knackAPI.post({
        scene: 'scene_9',
        view: 'view_21',//view_21 is a "new record" form that includes field_27
        body: {field_27: 'something'},
    });

    const recordCreated = response.json;
    console.log(recordCreated)//Expected output: a javascript object representing the Knack record created

} catch(err) {
    console.log(err);
}
```

### put (single)
Update a single record, based on the specified record ID.

#### put example
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

    const response = await knackAPI.put({
        scene: 'scene_9',
        view: 'view_22',//view_22 is an "update record" form containing field_27
        recordId: '62e1e6b8754ba000219b0d83',
        body: {field_27: 'something'},
    });

    const recordUpdated = response.json;
    console.log(recordUpdated)//Expected output: a javascript object representing the Knack record updated

} catch(err) {
    console.log(err);
}
```

### delete (single)
Delete a single record, based on the specified record ID.

#### delete example
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

    const deleteResponse = await knackAPI.delete({
        recordId: '62e1e6b8754ba000219b0d83', 
        scene: 'scene_9',
        view: 'view_21',//view_21 is a view with a delete link like a grid or details view
    });

    console.log(deleteResponse)//Expected output: {"delete": true}

} catch(err) {
    console.log(err);
}
```

### getMany
(partially written)

#### Parameters of getMany request

`getMany` accepts the [Common parameters for Standard CRUD API calls](#common-parameters-for-standard-crud-api-calls).

* Note: in the context of `getMany` (if using view-based authentication) the `view` parameter should point to a Knack app `view` that lists many records such as a grid, search or list view.

Additional parameters, on top of the standard ones, for `getMany` are as follows:

| Parameter | Type | Required? | Details  |
| ---                |  ---  | ---       | ---      |
| filters            | Filters object | No | A javascript object version of <a href="https://docs.knack.com/docs/constructing-filters">Knack filter object</a>|
| format             |  string | No | Knack API call <a href="https://docs.knack.com/docs/formatting">formatting options</a> (```raw```, ```both```, or ```html```) |
| rowsPerPage | integar | No. Defaults to 1000 if not provided. | How many records to get per page of data. See <a href="https://docs.knack.com/docs/pagination">pagination Knack docs</a> |
| startAtPage | integar | No. Defaults to 1 if not provided | The first page of data to get. Knack-api-helper will fetch this page of data, then any subsequent pages in order (page 1,2,3,4 etc) until all records are fetched or until it has fetched the ```maxRecordsToGet``` number of records (see below).<br> E.g., if there are 10000 records available and you set ```startAtPage: 5``` (and leave ```rowsPerPage``` and ```maxRecordsToGet``` at their default values), knack-api-helper will fetch pages 5-10, so you will receive the last 5000 records of the available 10000. |
| maxRecordsToGet | integar | No. Defaults to all records if not provided. | The maximum number of records to get. E.g., if you set this to 1500, and there are 30,000 records available, only the first 1500 records will be fetched.<br>Knack-api-helper will fetch pages in order, it will not go "backwards" to earlier pages to fetch additional records. E.g., if a Knack object has only 2000 records and you set ```startAtPage: 2``` and ```maxRecordsToGet: 1500```, the first 1000 records will be skipped and you will only get the final 1000 records (not 1500). |

#### Advantages of using view-based authentication for getMany
There are several advantages of using a view-based `getMany` request, even when you run it with server-side code:
1. You can get fields from connected objects (if you include them in the underlying view you are making the API call to) alongside the main records. This can avoid the need for extra API calls to join data.
2. You can build your filtering logic in the data-source settings of view, avoiding the need to use javascript to build filters.

#### Example getMany request (object based authentication)

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

#### Example getMany request (view-based authentication)

```javascript
try {
    const knackAPI = new KnackAPI({
        auth: 'view-based',
        applicationId: 'your application ID',
    });

    await knackAPI.login({
        email: 'email@email.com',
        password: process.env.password
    });

    const response = await knackAPI.getMany({
        scene: 'scene_10',
        view: 'view_26',//view_26 is a table/grid view or a search view
        format: 'raw',
        //Other settings are available as per previous example, if needed
    });

    console.log(response.records);
    //Expected output: an array of records from view_26, contianing only the raw field data
} catch (err) {
    console.log(err);
}
```

### postMany
Create many records using a single API call. Uses promise.allSettled under the hood, to allow for some requests to succeed and some to fail.

#### postMany example (view-based authentication)
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

    const recordsToCreate = [
        {field_22: 'some data 1'},
        {field_22: 'some data 2'},
        {field_22: 'some data 3'},
        {field_22: 'some data 4'},
        {field_22: 'some data 5'},
        {field_22: 'some data 6'},
    ]

    const responses = await knackAPI.postMany({
        scene: 'scene_106',
        view: 'view_269',//View_269 is a "create record" form with the appropriate field in it
        records: recordsToCreate,
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
### putMany
Update many records using a single API call. Uses promise.allSettled under the hood, to allow for some requests to succeed and some to fail.

#### putMany example (view-based authentication)

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

    const recordsToUpdate = [
        {id: '62e1e6b8754ba000219b0d83', field_22: 'some data 1'},
        {id: '62e1e6b8754ba00021XXsd83', field_22: 'some data 2'},
        {id: '622341b8754ba000212f0d83', field_22: 'some data 3'},
        {id: '62e1e6123dfaw345b0223d83', field_22: 'some data 4'},
    ]

    const responses = await knackAPI.putMany({
        scene: 'scene_106',
        view: 'view_269',//view_269 is an "update record" form view with the appropriate fields editable
        records: recordsToUpdate,
    });

    if(responses.summary.rejected > 0){
        res.summary.errors.forEach(err => {
            errorHandler(err.reason);
        })
    }
} catch(err){
    //To catch errors from knackAPI.login()
    //Errors from .postMany() will not reach here
    console.log(err)
}
```

### deleteMany

#### deleteMany example
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

    const recordsToDelete = [
        {id: '62e1e6b8754ba000219b0d83'},
        {id: '62e1e6b8754ba00021XXsd83'},
        {id: '622341b8754ba000212f0d83'},
        {id: '62e1e6123dfaw345b0223d83'},
    ]

    const responses = await knackAPI.postMany({
        scene: 'scene_106',
        view: 'view_269',//view_269 is a form view with the appropriate fields editable
        recordsToUpdate,
    });

    return await knackAPI.deleteMany({
        records: recordsToDelete,
        scene: 'scene_9',
        view: 'view_21',
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

## Special CRUD API calls

These methods deal with non-standard API calls to your Knack database. Non-standard means operations that are outside of normal create, read, update or delete of one/many records in your database.

These methods are less commonly used, but can be very useful.

They also may have less standard parameters or may have special requirements for usage (eg some only work with view-based authentication).

### getDataFromReportView()

This method lets you query a Knack "report" view (pivot table, bar chart, pie chart, line chart or similar) to obtain consolidated / summarized data.

Important note: this method relies on view-based authentication, so knackAPI must be initialised with view-based authentication (it cannot be used with object-based).

`getDataFromReportView()` accepts SOME of the [Common parameters for Standard CRUD API calls](#common-parameters-for-standard-crud-api-calls) as listed below:
1. `scene` (scene containing the report view)
2. `view` (the report view to use for making the view-based API call. This may contain one or more charts.
3. `helperData` (optional)
4. `retries` (optional, defaults to 5)

It also supports one additional parameter:


| Parameter | Type | Required? | Details  |
| ---  | ---  | --- | --- |
| sceneRecordId | string | No | The record ID to filter records by, if your report is situated on a child page that deals with one particular record (ie it has the data source of "records connected to this page's XXX record"). (example below) |

#### Example getDataFromReportView() request (without sceneRecordId)

This example references a report view on a top-level scene. Eg a report view summarising all "Project records". (The URL of the page in the live app does NOT contain a record ID eg `your-org.knack.com#your-app/projects/`). 

This is the simplest usage of `getDataFromReportView()`.

The example has two charts within the report view. So `getDataFromReportView()` will return an array of two objects, one for each chart.

```javascript

    //Initialise knack-api-helper. You MUST use view-based auth to use getDataFromReportView()
    const knackAPI = new KnackAPI({
        auth: 'view-based',
        applicationId: "YOUR APPLICATION ID",
        userToken: Knack.getUserToken()
    });

    const reportDataResponse = await knackAPI.getFromReportView({
        view: 'view_6',
        scene: 'scene_2'
    })

    console.log(reportDataResponse.json);
    //Expected output: 
    //An array of report objects, 1 per chart in your report view
    reports: [
        //Example of 1 report view. 
        { 
            records: [
                //Structure of records depends on your report setup. Example:
                { group_0: 'Some grouping', calc_0: '$123,000', raw_0: 123000},
                { group_0: 'Some other group', calc_0: '$456,000', raw_0: 456000},
            ], 
            filters: [
                //Structure of filters depends on your report setup.
                { header: 'Some grouping' },
                { header: 'Some other group' },
            ], 
            summaries: [
                //Structure of summaries depends on your report setup.
                {}
            ]
        },
    ]

```

#### Example getDataFromReportView() request (with sceneRecordId)

This example references a report view on a child page that deals with one particular record.

For example, in an app where Invoices are connected to Projects, and the report view is situated a child page dealing with project records. The report's data source appears as "Invoices connected to this page's Project". 

(When viewing the live app, the URL of the page containing the report will include a record ID eg `your-org.knack.com#your-app/projects/63e1bfe1a978400745e3a735`, where `63e1bfe1a978400745e3a735` is the record ID of a Project record).

In this case,  you need to specify the record ID of the Project record via `sceneRecordId` when calling the Knack API. This tells Knack which Invoice records to summarize.

```javascript

    //Initialise knack-api-helper. You MUST use view-based auth to use getDataFromReportView()
    const knackAPI = new KnackAPI({
        auth: 'view-based',
        applicationId: "YOUR APPLICATION ID",
        userToken: Knack.getUserToken()
    });

    const reportDataResponse = await knackAPI.getFromReportView({
        view: 'view_8',
        scene: 'scene_3',
        sceneRecordid: '63e1bfe1a978400745e3a735'//The record ID of the parent record (eg one Project record)
    })

    console.log(reportDataResponse.json);
    //Expected output: as for previous example.

```

## File uploads

Uploading a file or image to Knack involves two steps:

1. **Upload the file/image to Knack servers.** After uploading, the response will contain a file ID such as `675fafbf3cfc88031b154795`.
2. **Create or update a Knack record**, using the ID of the file/image field as the value for a file or image field.

For more information on how Knack handle file uploads, refer to the [Knack File/Image Uploads Documentation](https://docs.knack.com/docs/fileimage-uploads).

Knack-api-helper requires this 2-step process but adds methods to make it easier.

The API calls to upload files to Knack servers have similar behaviour to the standard CRUD API calls listed above, including auto-retry when sensible.

There are 4 methods available for file uploads. These are:
* `uploadFile()` (usually for Node.js code, upload single file to Knack servers)
* `uploadFiles()` (usually for Node.js code, upload multiple files to Knack servers)
* `uploadFileFromInput()` (for client-side code only, upload single file from an HTML file input)
* `uploadFilesFromInput()` (for client-side code only, upload multiple files from an HTML file input)

All 4 methods share common parameters, as listed below:

### Common parameters for file upload API calls
| Parameter | Type | Required? | Auth type applies to | Details  |
| --- | --- | --- | --- | --- |
| helperData | object | No | Both | Any arbritrary object you want to include with the API call. This will get returned to you when you receive the response to the API call.<br><br> Useful for tracking data about the request that wouldn't ordinarily be easy to understand from the data received back from the API call. |
| retries | integar >= 0 | No | Both | The number of times to retry the API call/s on failure, if the error code indicates that a retry might fix the error ([see above](#auto-retry-and-delay-between-retries)). Defaults to 5 if no value is provided. |

### uploadFile()

Upload a single file to Knack servers. This method is most helpful for usage in Node.js code or similar, where you have a file stored locally that you want to upload. However, it could be adapted for use in the browser environment too.

**Parameters:**
* The common parameters for file upload API calls plus:

| Parameter | Type | Required? | Auth type applies to | Details |
|----|----|----|----|----|
| uploadType | String | Yes | Both | Type of field you're uploading to, either `'file'` or `'image'`. |
| fileStream | Stream | Yes | Both | A readable stream of the file to upload.  |
| fileName   | String | Yes | Both | The name of the file to upload, including extension (eg `example.png`) |

#### uploadFile example (Node.js environment)

```javascript

const KnackAPI = require('../knack-api-helper.js');
const fs = require('fs');
const path = require('path');

async function uploadFileTest() {

    //Assuming there's a file stored in the same directory this is running called example.png
    //Extract the necessary information from the file and create a file stream
    const filePath = path.join(__dirname, 'example.png');
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    try {

        //Initialise knack-api-helper
        const knackAPI = new KnackAPI({
            auth: 'view-based', // You could also use object-based auth
            applicationId: "YOUR-APPLICATION-ID",
            //No need for userToken or login when uploading files.
        });

        //Upload the file to Knack servers
        const { uploadedFileId, response } = await knackAPI.uploadFile({
            uploadType: 'file',//Or 'image'
            fileStream,
            fileName
        });

        console.log('Upload successful. Here is the file ID to save to your Knack record: ', uploadedFileId);

        // Create a new record in Knack with the file attached
        // This example uses a publicly accessible form, but you could also use a login protected one if you pass a userToken or run login first
        // You could also use object-based auth if knackAPI was initialised with auth: 'object-based'
        const newRecordResponse = await knackAPI.post({
            scene: 'scene_7',
            view: 'view_6',
            body: {
                field_23: uploadedFileId, //Assuming field_23 is a file or image field in your Knack database
                field_25: 'Hello', //Any other value(s) you want to fill
            }
        })

        console.log('Added new record', newRecordResponse);

    } catch (error) {
        console.error(error);
    }
}

//Run the function defined above
uploadFileTest();
```

### uploadFiles()

Upload multiple files to Knack servers. As for `uploadFile`, this method is most helpful for usage in Node.js code or similar, where you have files stored locally that you want to upload. However, it could be adapted for use in the browser environment.

**Parameters:**

* The common parameters for file upload API calls plus:

| Parameter | Type | Required? | Auth type applies to | Details |
|----|----|----|----|----|
| filesToUpload | Array of objects | Yes | Both | An array of objects, 1 per file to upload, containing parameters `uploadType` (string: 'file' or 'image'), `fileStream` (a readable stream of the file to upload) and `fileName` (string eg `example.png`) |

#### uploadFiles() example (Node.js Environment)

```javascript

const KnackAPI = require('../knack-api-helper.js');
const fs = require('fs');
const path = require('path');

async function uploadFilesTest() {

    //Assuming there's are files stored in the same directory this is running called example..png, example2.png, example3.png
    //Extract the necessary information from the file and create a file stream
    const filePaths = [
        path.join(__dirname, 'example.png'),
        path.join(__dirname, 'example2.png'),
        path.join(__dirname, 'example3.png'),
    ]

    const filesToUpload = filePaths.map(filePath => {
        return {
            uploadType: 'file',//Or 'image'
            fileStream: fs.createReadStream(filePath),
            fileName: path.basename(filePath)
        }
    });

    try {

        // Initialise knack-api-helper
        const knackAPI = new KnackAPI({
            auth: 'view-based',
            applicationId: "YOUR-APPLICATION-ID",
            //No need for userToken or login when uploading files.
        });

        //Upload the file to Knack servers
        const { results, uploadedFileIds, allSucceeded, summary } = await knackAPI.uploadFiles({
            filesToUpload
        });

        if (!allSucceeded) {
            console.error('At least one file failed to upload. Here is a summary of the results:', summary);
            console.log(results);
        } else {
            console.log('All files uploaded successfully. Here are the IDs of uploaded files to append to Knack records');
            console.log(uploadedFileIds);
        }

        // Create one record in Knack per uploaded file
        // With the uploaded file attached to the record
        // This example uses a publicly accessible scene and view, but you can also use a login-protected one if you run the login method first
        // You could also use object-based auth if knackAPI was initialised with auth: 'object-based'
        const records = uploadedFileIds.map(uploadedFileId => {
            return {
                field_23: uploadedFileId, //Assuming field_23 is a file or image field in your Knack database
                field_25: 'Hello', //Any other value(s) you want to fill
            }
        });

        // Run the POST request to create the records in Knack
        const newRecordResponses = await knackAPI.postMany({
            scene: 'scene_7',
            view: 'view_6',
            records
        })

        // Check if all records were added successfully
        if (newRecordResponses.summary.rejected > 0) {
            console.error('Some records failed to post. Here is a summary of the results:', newRecordResponses.summary);
        } else {
            console.log('All records added successfully', newRecordResponses);
        }

    } catch (err) {
        // Handle any other errors
        // Errors from uploadFiles and postMany will NOT reach here
        console.error(err);
    }

}

uploadFilesTest();
```

### uploadFileFromInput()

Upload a single file from an HTML file input on a webpage to Knack servers. This method is ONLY for use in the browser environment eg in javascript code running on a webpage or a Knack page.

Since this method is for client-side (browser) code, we strongly recommend initialising knack-api-helper with view-based authentication to avoid exposing your API key to the public.

**Parameters:**

* The common parameters for file upload API calls plus:

| Parameter | Type | Required? | Auth type applies to | Details |
|----|----|----|----|----|
| uploadType | String | Yes | Both | Type of upload, either `'file'` or `'image'`.|
| fileInput  | HTMLElement | Yes | Both | The HTML file input element containing the file. The first uploaded file (index 0) will be used so we recommend that the file input is configured to only allow selecting a single file. |

#### uploadFileFromInput() Example (Browser Environment)

The example below uses plain HTML and javascript to create a form with a file input and a submit button. When the form is submitted, the file is uploaded to Knack servers and a new record is created with the file attached.

This code could be adapted to use jquery instead of plain javascript, as is more conventional when writing code to use within a Knack app.

```html

<!--HTML for a basic form with a file input (single select) and a submit button -->
<form id="fileUploadForm">
    <input type="file" id="fileInput" name="file">
    <button type="submit">Upload File</button>
</form>

<!-- Javascript to process form submit: upload file and create a new Knack record with it attached file -->
<script>
    document.getElementById('fileUploadForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            // Initialize the KnackAPI with your configuration
            const knackAPI = new KnackAPI({
                auth: 'view-based',
                applicationId: "YOUR-APPLICATION-ID",
                // No need for userToken or login when uploading files.
            });

            // Select the fileInput in the form
            const myFileInput = document.getElementById('fileInput');

            // Run the API call to upload file to Knack server
            const { response, uploadedFileId } = await knackAPI.uploadFileFromInput({
                uploadType: 'file', // Or 'image'
                fileInput: myFileInput
            });
            console.log('File uploaded successfully. Here is the ID to save to your Knack record:', uploadedFileId);

            // Create a new record in Knack with the file attached
            // This example uses a publicly accessible form, but you could also use a login protected one if you pass a userToken 
            // when initialising knackAPI or run the login method first
            const newRecordResponse = await knackAPI.post({
                scene: 'scene_7',
                view: 'view_6',
                body: {
                    field_23: uploadedFileId, // Assuming field_23 is a file or image field in your Knack database
                    field_25: 'Hello', // Any other value(s) you want to fill
                }
            });

            console.log('Added new record', newRecordResponse);

        } catch (error) {
            console.error('File upload or record creation failed:', error);
        }
    });
</script>
```

### uploadFilesFromInput()

Upload multiple files from an HTML file input to Knack servers. As for `uploadFileFromInput`, this method is ONLY for use in the browser environment eg in javascript code running on a webpage or a Knack page.

Since this method is for client-side (browser) code, we strongly recommend initialising knack-api-helper with view-based authentication to avoid exposing your API key to the public.

**Parameters:**

* The common parameters for file upload API calls plus:

| Parameter | Type | Required? | Auth type applies to | Details |
|----|----|----|----|----|
| uploadType | String | Yes | Both | Type of upload, either `'file'` or `'image'`.|
| fileInput  | HTMLElement | Yes | Both | The HTML file input element containing the file/s to upload. All files from the file input will be uploaded so you can configure it to accept multiple files. |

**Important note:** different to `uploadFiles()`, it's not possible in `uploadFilesFromInput()` to specify a different `uploadType` per file. Instead, we specify one `uploadType` for all files found in the `fileInput`.

#### uploadFilesFromInput() Example (Browser Environment)

```html

<!-- A basic form with a file input that allows multiple selection, and a submit button -->
<form id="fileUploadForm">
    <input type="file" id="fileInput" name="file" multiple>
    <button type="submit">Upload Multiple Files</button>
</form>

<!-- Javascript to process form submit: upload files and create new Knack records for each file -->
<script>
    document.getElementById('fileUploadForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            // Initialize the KnackAPI with your configuration
            const knackAPI = new KnackAPI({
                auth: 'view-based',
                applicationId: "YOUR-APPLICATION-ID",
                // No need for userToken or login when uploading files.
            });

            // Select the fileInput in the form
            const myFileInput = document.getElementById('fileInput');

            // Run the API call to upload files to Knack servers
            const { response, uploadedFileIds, allSucceeded, summary } = await knackAPI.uploadFilesFromInput({
                uploadType: 'file', // Or 'image'
                fileInput: myFileInput
            });

            // Check if all files were uploaded successfully
            if (allSucceeded) {
                console.log('All files uploaded successfully. Here are the IDs to save to your Knack records:', uploadedFileIds);
            } else {
                console.error('Some files failed to upload. Here is a summary of the results:', summary);
            }

            // Create one record in Knack per uploaded file
            // This example uses a publicly accessible form, but you could also use a login protected one if you pass a userToken
            // when initialising knackAPI or run the login method first
            const records = uploadedFileIds.map(uploadedFileId => {
                return {
                    field_23: uploadedFileId, // Assuming field_23 is a file or image field in your Knack database
                    field_25: 'Hello', // Any other value(s) you want to fill
                };
            });

            const newRecordResponses = await knackAPI.postMany({
                scene: 'scene_7',
                view: 'view_6',
                records
            });

            // Check if all records were added successfully
            if (newRecordResponses.summary.rejected > 0) {
                console.error('Some records failed to post. Here is a summary of the results:', newRecordResponses.summary);
            } else {
                console.log('All records added successfully', newRecordResponses);
            }

        } catch (err) {
            console.error('Something went wrong', err);
        }

    });
</script>
```