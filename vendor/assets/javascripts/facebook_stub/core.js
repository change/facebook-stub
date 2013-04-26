(function(window, undefined) {

// var permissions = {
//   "data": [
//     {
//       "installed": 1,
//       "status_update": 1,
//       "photo_upload": 1,
//       "video_upload": 1,
//       "email": 1,
//       "create_note": 1,
//       "share_item": 1,
//       "publish_stream": 1,
//       "publish_actions": 1
//     }
//   ]
// }

  // two globals for creating the cookie
  // FB Functions
  function init(data) {
    FBWorld.initialized = true;
    state('appId', data.appId);
  }

  function missingPermissions(permissions){
    var missing = [];
    var perms = getPermissions();
    var desired = permissions && permissions.split(',') || [];
    for (var i=0; i<desired.length; i++){
      if (!perms || !perms[desired[i]]) {
        missing.push(desired[i]);
      }
    }
    return missing;
  }

  // login
  function login(callback, options) {
    if (calledBeforeInit('login')) return;
    if (FBWorld.state('loggedIn')) {
      if (FBWorld.state('connected')) {
        var missing = missingPermissions(options.scope);
        if (!missing || missing.length === 0){
          callback(getStatus());
        }else{
          options.missing_permissions = missing;
          promptToAddPermissions(options, callback);
        }
      }else{
        promptToConnect(options, callback);
      }
    }else{
      promptToLogin(options, callback);
    }
  }

  // simulate prompt to login
  function promptToLogin(options, callback, skipConnection) {
    FBWorld.beingPromptedToLogin = true;
    FBWorld.beingPromptedToLoginOptions = options;
    FBWorld.beingPromptedToLoginCallback = callback;
    FBWorld.beingPromptedToLoginSkipConnection = skipConnection;
  }

  // simulates resolving a login prompt in one of three ways
  function resolveLoginPrompt(successfull, facebook_uid) {
    if (!FBWorld.beingPromptedToLogin) throw "you are not being prompted to login";
    var
      options  = FBWorld.beingPromptedToLoginOptions,
      callback = FBWorld.beingPromptedToLoginCallback;

    // reset the FBWorld state
    FBWorld.beingPromptedToLogin = false;
    FBWorld.beingPromptedToLoginOptions = undefined;
    FBWorld.beingPromptedToLoginCallback = undefined;

    if (successfull){
      FBWorld.setUid(facebook_uid);
      FBWorld.loggedIn();

      if (!FBWorld.beingPromptedToLoginSkipConnection && !FBWorld.state('connected')) {
        promptToConnect(options, callback);
      } else {
        setPermissions(options.scope);
        callback(getStatus());
      }
      FBWorld.beingPromptedToLoginSkipConnection = false;

    } else {
      FBWorld.notLoggedIn();
      callback(getStatus());
    }
  }

  function successfullyLogin(facebook_uid){
    resolveLoginPrompt(true, facebook_uid);
  }

  function failToLogin(){
    resolveLoginPrompt(false);
  }

  function cancelLogin(){
    resolveLoginPrompt(false);
  }


  // connect to app

  // simulate prompt to connect
  function promptToConnect(options, callback) {
    FBWorld.beingPromptedToConnect = true;
    FBWorld.beingPromptedToConnectOptions = options;
    FBWorld.beingPromptedToConnectCallback = callback;
  }

  function resolvePromptToConnect(approved) {
    if (!FBWorld.beingPromptedToConnect) throw "you are not being prompted to connect";
    var
      options  = FBWorld.beingPromptedToConnectOptions,
      callback = FBWorld.beingPromptedToConnectCallback;

      // reset the FBWorld state
      FBWorld.beingPromptedToConnect = false;
      FBWorld.beingPromptedToConnectOptions = undefined;
      FBWorld.beingPromptedToConnectCallback = undefined;

    if (approved){
      FBWorld.connected();
      setPermissions(options.scope);
    } else {
      FBWorld.notConnected();
    }

    callback(getStatus());
  }

  function acceptPromptToConnect() {
    resolvePromptToConnect(true);
  }

  function denyPromptToConnect() {
    resolvePromptToConnect(false);
  }

  function cancelPromptToConnect() {
    resolvePromptToConnect(false);
  }

  // add permissions to app

  // simulate prompt to add permissions
  function promptToAddPermissions(options, callback) {
    FBWorld.beingPromptedToAddPermissions = true;
    FBWorld.beingPromptedToAddPermissionsOptions = options;
    FBWorld.beingPromptedToAddPermissionsCallback = callback;
  }

  function resolvePromptToAddPermissions(approved, permissions) {
    if (!FBWorld.beingPromptedToAddPermissions) throw "you are not being prompted to add permissions";
    var
      options  = FBWorld.beingPromptedToAddPermissionsOptions,
      callback = FBWorld.beingPromptedToAddPermissionsCallback;

      // reset the FBWorld state
      FBWorld.beingPromptedToAddPermissions = false;
      FBWorld.beingPromptedToAddPermissionsOptions = undefined;
      FBWorld.beingPromptedToAddPermissionsCallback = undefined;

    if (approved){
      if (permissions){
        var existing_permissions = getPermissions();
        if (existing_permissions){
          var new_permissions = permissions.split(',');
          for (var i=0; i<new_permissions.length; i++){
            existing_permissions[new_permissions[i]] = 1;
          }
          setPermissions(Object.keys(existing_permissions).join(','));
        }
        else{
          setPermissions(permissions);
        }
      }else{
        setPermissions(options.scope);
      }
    }

    callback(getStatus());
  }

  function acceptPromptToAddPermissions(permissions) {
    resolvePromptToAddPermissions(true, permissions);
  }

  function skipPromptToAddPermissions() {
    resolvePromptToAddPermissions(false);
  }

  function beingPromptedToAddThesePermissions(permissions){
    if (FBWorld.beingPromptedToAddPermissionsOptions && FBWorld.beingPromptedToAddPermissionsOptions.missing_permissions) {
      var missingOptions = FBWorld.beingPromptedToAddPermissionsOptions.missing_permissions;
      return missingOptions.sort().toString() == permissions.split(',').sort().toString();
    } else {
      return false;
    }
  }

  function hasPermissions(permissions) {
    return FBWorld.state('loggedIn') && FBWorld.state('connected') && missingPermissions(permissions).length === 0;
  }

  function logout(callback) {
    if (calledBeforeInit('logout')) return;
    if (!FBWorld.state('loggedIn')) console.log('FB.logout() called without a session.');
    FBWorld.notLoggedIn();
    callback(getStatus());
  }

  function getLoginStatus(callback, force) {
    if (calledBeforeInit('getLoginStatus')) return;
    callback(getStatus());
  }

  function getUserID() {
    if (calledBeforeInit('getUserID') || !FBWorld.state('connected')) return 0; // should not return anything unless connected
    var id = uid();
    return id && id.toString() || undefined; // FB.getUserID returns a string, so make sure we do the same
  }


  function getSession() {
    if (calledBeforeInit('getSession')) return false;
    return getStatus().session;
  }

  function forceReturnError(error) {
    FBWorld.returnError = error;
  }

  function resetForcedReturnError() {
    FBWorld.returnError = undefined;
  }

  function api(path, method, params, callback) {
    // Curry arguments to allow multiple forms:
    // api(path, callback)
    // api(path, method, callback)
    // api(path, params, callback)
    // api(path, method, params, callback)
    if (callback === undefined) {
      if (params === undefined) {
        callback = method;
        method = undefined;
      } else {
        callback = params;
        if (typeof method == 'string')
          params = undefined;
        else {
          params = method;
          method = undefined;
        }
      }
    }

    var callbackResult;
    if (!FBWorld.state('connected')) {
      callback(apiUnconnectedMessage());
      return;
    }

    if(/\/me\/friends(\?.*)?/.test(path)) { // /me/friends?limit=100
      callbackResult = {data:FBWorld.friendList()};
    } else if(/\/me\/permissions(\?.*)?/.test(path)) { // /me/permissions
      var theState = FBWorld.state();
      var perms;
      if (theState && theState.perms && theState.perms.data)
        perms = {data:[theState.perms.data]};
      callbackResult = perms;
    } else if(/\/.+\/feed/.test(path) && method == 'post') { // /me/feed or /123/feed
      FBWorld.posted({path: path, params: params});
      callbackResult = {id: randomPostId()};
    } else if(/\/me\/.+:.+/.test(path) && method == 'post') {
      FBWorld.posted({path: path, params: params});
      callbackResult = {id: randomPostId()};
    } else if (/\//.test(path) && method == 'post') { // / for batch api updates
      var result = [];
      for(var i=0; i<params.batch.length; i++) {
        var batchItem = params.batch[i];
        result.push(
          {
            "code":200,
            "headers":[
            {
              "name":"Access-Control-Allow-Origin",
              "value":"*"
            },{
              "name":"Cache-Control",
              "value":"private, no-cache, no-store, must-revalidate"
            },{
              "name":"Connection",
              "value":"close"
            },{
              "name":"Content-Type",
              "value":"text\/javascript; charset=UTF-8"
            },{
              "name":"Expires",
              "value":"Sat, 01 Jan 2000 00:00:00 GMT"
            },{
              "name":"Pragma",
              "value":"no-cache"
            }],
            "body":"{\n   \"id\": \"" + batchItem.relative_url.match("/(.*)/feed")[1] +'_'+randomPostId()+"\"\n}"
          }
        );
      }
      callbackResult = result;
    } else {
      callbackResult = apiFailMessage(path);
    }
    callback(FBWorld.returnError || callbackResult);
  }

  function randomPostId() {
    return Math.floor(Math.random() * 100000);
  }

  function apiUnconnectedMessage() {
    return {
      "error": {
        "message": "An active access token must be used to query information about the current user.",
        "type": "OAuthException",
        "code": 2500
      }
    };
  }

  function apiFailMessage(path) {
    return {
      "error": {
        "message": "(#803) Some of the aliases you requested do not exist: " + path,
        "type": "OAuthException",
        "code": 803
      }
    };
  }

  // FBWorld Functions
  //3 states: loggedOut, loggedIn, connected
  function state() {
    var theState = JSON.parse(FBWorld.Helpers.makeMeACookie('fb-stub') || '{}');
    if (arguments.length === 0) return theState;
    if (arguments.length === 1) return theState[arguments[0]];
    if (arguments.length === 2) {
      theState[arguments[0]] = arguments[1];
      FBWorld.Helpers.makeMeACookie('fb-stub', JSON.stringify(theState), cookieOptions);
      return arguments[1];
    }
    if (arguments.length === 3) {
      if(typeof(theState[arguments[0]]) == 'undefined') theState[arguments[0]] = {};
      theState[arguments[0]][arguments[1]] = arguments[2];
      FBWorld.Helpers.makeMeACookie('fb-stub', JSON.stringify(theState), cookieOptions);
      return arguments[2];
    }
  }

  function uid() {
    return FBWorld.state('uid');
  }

  function setUid(newUid) {
    return FBWorld.state('uid', newUid);
  }

  function appId() {
    return FBWorld.state('appId');
  }

  function setPermissions(newPermissions) {
    return FBWorld.state('perms', 'data', convertPermsToData(newPermissions));
  }

  function setSecret(newSecret) {
    return FBWorld.state('secret', newSecret);
  }

  function loggedIn(perms) {
    createConnectedCookie();
    FBWorld.state('loggedIn', true);
    if (perms) setPermissions(perms);
    return true;
  }

  function notLoggedIn() {
    deleteConnectedCookie();
    FBWorld.state('loggedIn', false);
  }

  function connected() {
    createConnectedCookie();
    FBWorld.state('connected', true);
  }

  function notConnected() {
    deleteConnectedCookie();
    FBWorld.state('connected', false);
  }

  function addFriend(id, name) {
    var friends = FBWorld.friendList();
    friends.push({id: id, name: name});
    FBWorld.Helpers.makeMeACookie('fb_friends', JSON.stringify(friends), cookieOptions);
  }

  function friendList() {
    return JSON.parse(FBWorld.Helpers.makeMeACookie('fb_friends') || '[]');
  }


  // sharing

  function ui(options, callback) {
    if (FBWorld.state('loggedIn')) {
      if (options.method === 'feed' || options.method === 'stream.share'){
        FBWorld.beingPromptedToShare = true;
        FBWorld.beingPromptedToShareOptions  = options;
        FBWorld.beingPromptedToShareCallback = callback;
      }
    }else{
      // if not logged in, prompt to login without connecting to app
      promptToLogin(options, function() {
        FB.ui(options, callback);
      }, true);
    }

  }

  // simulate closing the share prompt by either sharing or canceling
  function resolveSharePrompt(way) {
    response = {};
    if (way === 'share') response.post_id = Math.floor(Math.random() * 100000);
    //if (way === 'cancel');

    if (typeof FBWorld.beingPromptedToShareCallback === 'function')
      FBWorld.beingPromptedToShareCallback(response);
    FBWorld.beingPromptedToShare         = false;
    FBWorld.beingPromptedToShareOptions  = undefined;
    FBWorld.beingPromptedToShareCallback = undefined;
  }

  function confirmSharePrompt(){
    resolveSharePrompt('share');
  }

  function cancelSharePrompt(){
    resolveSharePrompt('cancel');
  }

  function reset() {

    FBWorld.beingPromptedToLogin             = false;
    FBWorld.beingPromptedToLoginOptions      = undefined;
    FBWorld.beingPromptedToLoginCallback     = undefined;
    FBWorld.beingPromptedToLoginSkipConnection = false;
    FBWorld.beingPromptedToConnect           = false;
    FBWorld.beingPromptedToConnectOptions    = undefined;
    FBWorld.beingPromptedToConnectCallback   = undefined;
    FBWorld.beingPromptedToAddPermissions         = false;
    FBWorld.beingPromptedToAddPermissionsOptions  = undefined;
    FBWorld.beingPromptedToAddPermissionsCallback = undefined;
    FBWorld.beingPromptedToShare             = false;
    FBWorld.beingPromptedToShareOptions      = undefined;
    FBWorld.beingPromptedToShareCallback     = undefined;
    FBWorld.resetForcedReturnError();

    // reset cookie
    FBWorld.Helpers.makeMeACookie('fb-stub', null, cookieOptions);
    FBWorld.Helpers.makeMeACookie('fb_friends', null, cookieOptions);
  }

  function posted(){
    var p = state('posted') || [];
    if (arguments.length == 1){
      p.push(arguments[0]);
    }
    state('posted', p);
    return p;
  }

  // Give list of params posted on path
  function lastPostForPath(path) {
    var results = [];
    var posted = state('posted') || [];
    for (var i = posted.length - 1; i >= 0; i--) {
      var post = posted[i];
      if (post.path == path)
        return post.params;
    }
    return undefined;
  }

  var XFBML = {
    parse: function(element, callback) {
      callback();
    }
  };


  FB = { // Emulates the FB API
    getLoginStatus : getLoginStatus,
    logout         : logout,
    login          : login,
    init           : init,
    getSession     : getSession,
    api            : api,
    XFBML          : XFBML,
    getUserID      : getUserID,
    ui             : ui
  };

  FBWorld = { // used to set the state of Facebook

    // the state of the Facebook World
    state                   : state,

    // Set the state of the Facebook World
    loggedIn                : loggedIn,
    notLoggedIn             : notLoggedIn,
    setUid                  : setUid,
    appId                   : appId,
    setSecret               : setSecret,
    uid                     : uid,
    connected               : connected,
    notConnected            : notConnected,
    setPermissions          : setPermissions,
    getPermissions          : getPermissions,
    reset                   : reset,

    initialized             : false,

    // Simulate interactions with Facebook

    // login
    beingPromptedToLogin             : false,
    beingPromptedToLoginOptions      : undefined,
    beingPromptedToLoginCallback     : undefined,
    beingPromptedToLoginSkipConnection : false,
    successfullyLogin                : successfullyLogin,
    failToLogin                      : failToLogin,
    cancelLogin                      : cancelLogin,

    // connecting
    beingPromptedToConnect           : false,
    beingPromptedToConnectOptions    : undefined,
    beingPromptedToConnectCallback   : undefined,
    acceptPromptToConnect            : acceptPromptToConnect,
    denyPromptToConnect              : denyPromptToConnect,
    cancelPromptToConnect            : cancelPromptToConnect,

    // permissions
    beingPromptedToAddPermissions         : false,
    beingPromptedToAddPermissionsOptions  : undefined,
    beingPromptedToAddPermissionsCallback : undefined,
    beingPromptedToAddThesePermissions    : beingPromptedToAddThesePermissions,
    hasPermissions                        : hasPermissions,
    acceptPromptToAddPermissions          : acceptPromptToAddPermissions,
    skipPromptToAddPermissions            : skipPromptToAddPermissions,

    //sharing
    beingPromptedToShare             : false,
    beingPromptedToShareOptions      : undefined,
    beingPromptedToShareCallback     : undefined,
    confirmSharePrompt               : confirmSharePrompt,
    cancelSharePrompt                : cancelSharePrompt,

    //friends
    addFriend                        : addFriend,
    friendList                       : friendList,

    // posted
    posted                          : posted,
    lastPostForPath                 : lastPostForPath,

    // error testing
    returnError                     : undefined,
    forceReturnError                : forceReturnError,
    resetForcedReturnError          : resetForcedReturnError
  };




  // PRIVATE FUNCTIONS

  function getStatus() {
    var theState = FBWorld.state();

    // Connected
    if (theState.loggedIn && theState.connected) {
      var status = {
        status: "connected",
        authResponse: createConnectedCookie()
      };

      return status;
    }

    // not connected
    if (theState.loggedIn && !theState.connected) {
      return {
        authResponse: null,
        status: 'notConnected'
      };
    }

    // not logged in
    if (!theState.loggedIn) {
      return {
        authResponse: null,
        status: 'unknown'
      };
    }

  }

  function getPermissions() {
    var theState = FBWorld.state();
    return theState.perms && theState.perms.data || undefined;
  }

  function calledBeforeInit(function_name) {
    if (FBWorld.initialized) return false;
    console.log("FB."+function_name+" called before FB.init");
    return true;
  }

  function convertPermsToData(perms) {
    var data = {};
    perms = perms && perms.split(',') || [];
    for (var i=0; i<perms.length; i++){
      data[perms[i]] = 1;
    }
    return data;
  }

  var cookieOptions = { domain: window.location.hostname.replace(/^www/, '')};

  // cookie looks like this: (with the quotes): "access_token=theToken&base_domain=local-change.org&expires=0&secret=theSecret&session_key=theSessionKeysig=theSig-Hashed&uid=theUID"
  function createConnectedCookie() {
    var theState = {
      userID: state('uid'),
      accessToken: 'theAccessToken|hashData',
      signedRequest: 'ABC123',
      expiresIn: 2*60*60
    };

    if (uid() !== null) {
      theState.uid = uid();
    }

    var secret = state('secret');
    if (!secret) throw "secret is not set. Use FBWorld.setSecret('secret')";
    FBWorld.Helpers.makeMeACookie('fbsr_'+state('appId'), cookieToString(theState, secret), cookieOptions);
    return theState;
  }

  function cookieToString(theState, secret) {
    // Set the algorithm here, to keep any changes here.
    theState.algorithm = 'HMAC-SHA256';

    var payload        = JSON.stringify(theState),
        encodedPayload = FBWorld.Helpers.base64_encode(payload),
        shaObj         = new FBWorld.Helpers.jsSHA(encodedPayload, "ASCII"),
        b64Signature   = shaObj.getHMAC(secret, "ASCII", "SHA-256", "B64");

    // jsSHA uses an odd Base64 encoder, which uses + where FB has -. For now we'll just replace them,
    // but if we find other inconsistencies, we should use the HEX value and encode it ourselves.
    b64Signature.replace('+', '-');

    return b64Signature + '.' + encodedPayload;
  }

  function deleteConnectedCookie() {
    FBWorld.Helpers.makeMeACookie('fbsr_'+state('appId'), null, cookieOptions);
  }


})(this);
FBWorld.Helpers = {};
setTimeout(function() { if (typeof fbAsyncInit === 'function') fbAsyncInit(); }, 1);
