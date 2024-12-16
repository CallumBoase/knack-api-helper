# Knack-api-helper CHANGELOG

## 2022/04/26 Version 2.2.4 -> 2.2.5 -> 2.2.6
* Updated mistake in readme for `putMany()`
* Skipped 2.2.5 due to unpublishing version 2.2.5 from NPM due to publishing mistake.

## 2022/01/29 Version 2.2.3 -> 2.2.4
* Added new method getFromReportView() the enables getting data from report view (when using view-based auth)
* Refactored knack-api-helper.js to support this, but there are no functionality changes to existing methods (get, post, put, delete, getMany, postMany, putMany, deleteMany, login, remoteLogin, validateSession)

## 2022/09/16 Version 2.2.2 -> 2.2.3
* Fixed browser build (browser loadable file). Otherwise unchanged

## 2022/09/11 Version 2.2.1 -> 2.2.2
* Added MIT license file.

## 2022/09/11 - Version 2.2.0 -> 2.2.1
* Updated the readme to fix error in instructions for loading knack-api-helper into Knack javascript area.

## 2022/08/29 - Version 2.1.5 -> 2.2.0
* Added `validateSession()` method (see readme for details)

## 2022/05/08 - Version 2.1.4 -> 2.1.5
* Updated readme.md with more documentation and examples

## 2022/12/07 - Version 2.1.3 -> 2.1.4

* Added additional parameters for ```knackAPI.getMany()``` to support flexible pagination and getting a subset of records from the Knack database. Previously, the lack of options forced you to get ALL records matching your filters each time you called ```getMany()```. It was not possible to make use of Knack's pagination settings.<br>The new parameters available are:
    * ```rowsPerPage```: allowing you to specify how many records are obtained "per page" of data, ie per ```GET``` request that ```getMany``` makes in the background.
    * ```startAtPage```: allowing you to customise the first page of data to get with ```getMany()``` (previously always started with page 1)
    * ```maxRecordsToGet```: allowing you to limit the number of records obtained (previously always obtained ALL records)
* The combination of the above three lets you do various flexible API calls to get just the records you require.

## 2022/11/16 - Verison 2.1.2 -> 2.1.3

* Added optional parameter for ```knackAPI.getMany()```: ```format: 'string'```. This allows you to make use of the Knack API call formatting options of "raw", "both" or "html".

## 2022/08/25 - Version 2.1.1 -> 2.1.2

* Small bugfix: glitch in many results report (knackAPI.tools.manyResultsReport.create). Previously the results report would be inserted on the page using "insertAfter", regardless of what options is chosen (one of: insertAfter, insertBefore, appendTo, prependTo). Fixed so it obeys the location (insertAfter, insertBefore, appendTo or prependTo)

## 2022/08/08 - Version 2.1.0 -> 2.1.1

* Small bugfix: customised retries. If you passed ```retries: 0``` as setting to ```knackAPI({})``` method (eg get, post, put etc) the package would view this as falsey and revert to 5 retries. Now ```retries: 0``` will work as expected
* Minor new feature: many summary errors. when running ```knackAPI.postMany({})``` or ```knackAPI.putMany({})``` or ```knackAPI.deleteMany({})``` , the results.summary object now contains new data ```results.summary.errors```. This is a filtered list of the full array of responses, only giving the rejected responses.

## 2022/08/05 - Version 2.0.0 -> 2.1.0

Update knack-api-helper package to reference new version of @callum.boase/fetch package, and leverage the new features of @callum.boase/fetch.

Previous behaviour: any unsuccessful API call to Knack retries with a static 1 second (1000ms) delay between attempts.

New behaviour: 
* Only retry unsuccessful API calls with response code of 429 or >= 500 (because other error codes are permanent failures and retry is pointless)
* If error code of unsuccessful API call is 429, retry will happen with exponential backoff (first attempt wait 1000ms, second attempt wait 2000ms, third attempt wait 4000ms etc). However unsuccessful API calls returning code >= 500 will still have a static 1 second delay.

## 2022/07/25 - MAJOR UPGRADE TO VERSION 2.0.0 (including breaking changes)

**Summary:**
1. Added support for remote login via the Knack API
    * [login()](README.md#login) method added
    * [remoteLogin()](README.md#remoteLogin) added
2. It is now possible to initialize KnackAPI with no user token (for API calls to public pages)
3. Renamed key in KnackAPI(config) object. Old key name: *staticUserToken*, new name: *userToken* (due to different functionality)
4. We no longer automatically run Knack.getUserToken() when initialising KnackAPI for view-based authentication without a user token.The user must now specify the userToken either with a static value, or with Knack.getUserToken() method (if running code in Knack javascript area). See [installation instructions for browser](README.md#use-in-browser-or-knack-javascript-code-area)

**Breaking changes**: 
Items 3 & 4 are breaking changes.
