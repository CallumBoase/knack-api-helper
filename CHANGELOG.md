# Knack-api-helper CHANGELOG

## 2022/07/25 - MAJOR UPGRADE TO VERSION 3.0.0 (including breaking changes)

**Summary:**
1. Added support for remote login via the Knack API
    * [login()](/#login) method added
    * [remoteLogin()](/#remoteLogin) added
2. Enabled initialising KnackAPI with no user token for API calls to public pages
3. Renamed key in KnackAPI(config) object. Was: *staticUserToken*, new name: *userToken*
4. We no longer automatically run Knack.getUserToken() when there is no user token passed to KnackAPI initialising for view-based auth. The user must now specify {userToken: Knack.getUserToken()} where applicable.

Breaking changes: 
Items 3 & 4 are breaking changes.
