# Knack-api-helper CHANGELOG

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
