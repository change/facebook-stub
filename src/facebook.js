;(function(window, undefined) {

  //var standardPerms = '{"extended":["status_update","photo_upload","video_upload","offline_access","email","create_note","share_item","publish_stream","contact_email"],"user":["manage_friendlists","create_event","read_requests","manage_pages"],"friends":[]}';

  // two globals for creating the cookie
  // FB Functions
  function init(data) {
    FBWorld.initialized = true;
    state('appId', data.appId);
  }

  function login(callback, options) {
    if (calledBeforeInit('login')) return;
    if (FBWorld.state('loggedIn')) {
      console.log('FB.login() called when user is already connected.');
      if (FBWorld.state('connected')) {
        callback(getStatus('standard'));
      } else {
        simulatePromptToConnect(callback, options);
      }
    } else {
      simulatePromptToLogin(callback, options);
    }
  }

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
  
  function appId() {
    return FBWorld.state('appId');
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
    XFBML          : XFBML
  };

  FBWorld = { // used to set the state of Facebook
    state                   : state,
    loggedIn                : loggedIn,
    notLoggedIn             : notLoggedIn,
    setUid                  : setUid,
    setSecret               : setSecret,
    uid                     : uid,
    appId                   : appId,
    connected               : connected,
    notConnected            : notConnected,
    setExtendedPermissions  : setExtendedPermissions,

    initialized                      : false,
    beingPromptedToLogIn             : false,
    beingPromptedToLogInCallback     : undefined,
    // this will come later, no need for it now
    // successfullyLogin: successfullyLogin,
    // failToLogin: failToLogin,

    beingPromptedToConnect           : false,
    beingPromptedToConnectInCallback : undefined,
    allowConnection                  : allowConnection,
    denyConnection                   : denyConnection,

    //friends
    addFriend                        : addFriend,
    friendList                       : friendList
  };

  if (FBWorld.Helpers) FBWorld.Helpers.resetMyCookies();
  else document.$cookie = {};

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

  function simulatePromptToLogin(callback, options) {
    // simulate being prompted to log in
    FBWorld.beingPromptedToLogIn = true;
    FBWorld.beingPromptedToLogInCallback = function(approved) {
      FBWorld.beingPromptedToLogin = false;
      FBWorld.beingPromptedToLoginCallback = undefined;
      if(approved) {
        FBWorld.loggedIn();
        if (!FBWorld.state('connected')) {
          simulatePromptToConnect(callback, options);
        } else {
          FBWorld.state('perms', 'standard', options.perms);
          callback(getStatus('standard'));
        }
      } else {
        FBWorld.notLoggedIn();
        callback(getStatus());
      }

    };
  };

  function simulatePromptToConnect(callback, options) {
    // simulate being prompted to connect
    FBWorld.beingPromptedToConnect = true;
    FBWorld.beingPromptedToConnectCallback = function(approved) {
      approved ? FBWorld.connected() : FBWorld.notConnected();
      FBWorld.beingPromptedToConnect = false;
      FBWorld.beingPromptedToConnectCallback = undefined;
      if (approved) {
        FBWorld.state('perms', 'standard', options.perms);
      }
      callback(getStatus('standard'));
    };
  };

  function allowConnection() {
    if (!FBWorld.beingPromptedToConnect) throw "you are not being prompted to connect";
    FBWorld.beingPromptedToConnectCallback(true);
  };

  function denyConnection() {
    if (!FBWorld.beingPromptedToConnect) throw "you are not being prompted to connect";
    FBWorld.beingPromptedToConnectCallback(false);
  };

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
