;(function(window, undefined) {

  //var standardPerms = '{"extended":["status_update","photo_upload","video_upload","offline_access","email","create_note","share_item","publish_stream","contact_email"],"user":["manage_friendlists","create_event","read_requests","manage_pages"],"friends":[]}';

  // two globals for creating the cookie
  // FB Functions
  function init(data) {
    FBWorld.initialized = true;
    state('appId', data.appId);
  }

  // login
  function login(callback, options) {
    if (calledBeforeInit('login')) return;
    if (FBWorld.state('loggedIn')) {
      console.log('FB.login() called when user is already connected.');
      if (FBWorld.state('connected')) {
        callback(getStatus('standard'));
        return;
      }
    }
    // simulate being prompted to login
    FBWorld.beingPromptedToLogin = true;
    FBWorld.beingPromptedToLoginOptions = options;
    FBWorld.beingPromptedToLoginCallback = callback;
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

      if (!FBWorld.state('connected')) {
        promptToConnect(options, callback);
      } else {
        FBWorld.state('perms', 'standard', options.perms);
        callback(getStatus('standard'));
      }

    } else {
      FBWorld.notLoggedIn();
      callback(getStatus());
    }
  };

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
      FBWorld.state('perms', 'standard', options.perms);
    } else {
      FBWorld.notConnected();
    }

    callback(getStatus('standard'));
  }

  function acceptPromptToConnect() {
    resolvePromptToConnect(true);
  };

  function denyPromptToConnect() {
    resolvePromptToConnect(false);
  };

  function cancelPromptToConnect() {
    resolvePromptToConnect(false);
  };





  function logout(callback) {
    if (calledBeforeInit('logout')) return;
    if (!FBWorld.state('loggedIn')) console.log('FB.logout() called without a session.');
    FBWorld.notLoggedIn();
    callback(getStatus());
  }

  function getLoginStatus(callback, perms) {
    if (calledBeforeInit('getLoginStatus')) return;
    callback(getStatus(perms ? 'extended' : false));
  }

  function getUserID() {
    if (calledBeforeInit('getUserID')) return;
    return uid();
  }


  function getSession() {
    if (calledBeforeInit('getSession')) return false;
    return getStatus().session;
  }

  function api(location, callback) {
    if (!FBWorld.state('connected')) {
      callback(undefined);
    } else if (location == '/me/friends') {
      callback({data:FBWorld.friendList()});
    } else if (location == '/me/permissions') {
      var theState = FBWorld.state();
      var perms;
      if (theState && theState.perms) {
        perms = {data:[theState.perms.extended]}
      }
      callback( perms );
    }
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

  function setExtendedPermissions(newPermissions) {
    return FBWorld.state('perms', 'extended', newPermissions);
  }

  function setSecret(newSecret) {
    return state('secret', newSecret);
  }

  function loggedIn() {
    createConnectedCookie();
    FBWorld.state('loggedIn', true);
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
    FBWorld.Helpers.makeMeACookie('fb_friends', JSON.stringify(friends));
  }

  function friendList() {
    return JSON.parse(FBWorld.Helpers.makeMeACookie('fb_friends') || '[]');
  }


  // sharing

  function ui(options, callback) {
    if (options.method === 'feed'){
      FBWorld.beingPromptedToShare = true;
      FBWorld.beingPromptedToShareOptions  = options;
      FBWorld.beingPromptedToShareCallback = callback;
    }
  }

  // simulate closing the share prompt by either sharing or canceling
  function resolveSharePrompt(way) {
    response = {};
    if (way === 'share') response.post_id = Math.floor(Math.random() * 100000);
    if (way === 'cancel');

    if (typeof FBWorld.beingPromptedToShareCallback === 'function')
      FBWorld.beingPromptedToShareCallback(response);
    FBWorld.beingPromptedToShare         = false;
    FBWorld.beingPromptedToShareOptions  = undefined;
    FBWorld.beingPromptedToShareCallback = undefined;
  };

  function confirmSharePrompt(){
    resolveSharePrompt('share');
  }

  function cancelSharePrompt(){
    resolveSharePrompt('cancel');
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
    setSecret               : setSecret,
    uid                     : uid,
    connected               : connected,
    notConnected            : notConnected,
    setExtendedPermissions  : setExtendedPermissions,

    initialized                      : false,

    // Simulate interactions with Facebook

    // login
    beingPromptedToLogin             : false,
    beingPromptedToLoginOptions      : undefined,
    beingPromptedToLoginCallback     : undefined,
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

    //sharing
    beingPromptedToShare             : false,
    beingPromptedToShareOptions      : undefined,
    beingPromptedToShareCallback     : undefined,
    confirmSharePrompt               : confirmSharePrompt,
    cancelSharePrompt                : cancelSharePrompt,

    //friends
    addFriend                        : addFriend,
    friendList                       : friendList
  };







  // PRIVATE FUNCTIONS

  function getStatus(permissions) {
    var theState = FBWorld.state();

    // Connected
    if (theState.loggedIn && theState.connected) {
      var status = {
        status: "connected",
        authResponse: createConnectedCookie()
      };

      if(typeof(permissions) != 'undefined') {
        status.perms = permissions == 'extended' ? JSON.stringify(theState.perms) : theState.perms.standard;
      }
      return status;
    }

    // not connected
    if (theState.loggedIn && !theState.connected) {
      return {
        perms: null,
        authResponse: null,
        status: 'notConnected'
      };
    }

    // not logged in
    if (!theState.loggedIn) {
      return {
        perms: null,
        authResponse: null,
        status: 'unknown'
      };
    }

  };

  function calledBeforeInit() {
    if (FBWorld.initialized) return false;
    console.log("FB."+meth+" called before FB.init");
    return true;
  }

  var cookieOptions = { path: '/', domain: window.location.hostname.replace(/^www/, '')};

  // cookie looks like this: (with the quotes): "access_token=theToken&base_domain=local-change.org&expires=0&secret=theSecret&session_key=theSessionKeysig=theSig-Hashed&uid=theUID"
  function createConnectedCookie() {
    var theState = {
      user_id: state('uid'),
      code: 'theAccessToken|hashData',
      // We need to verify the timezone for this value. Traditionally FB uses PST8PDT, but it may be UTC.
      issued_at: Math.floor(new Date().getTime() / 1000)
    };

    if (uid() != null) {
      theState.uid = uid();
    }

    FBWorld.Helpers.makeMeACookie('fbsr_'+state('appId'), cookieToString(theState, state('secret')), cookieOptions);
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
