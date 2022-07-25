# Knack-api-helper CHANGELOG

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
