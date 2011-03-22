;(function(window, undefined){

  // two globals for creating the cookie
  // FB Functions
  function init(data){
    FBWorld.initialized = true;
    state('appId', data.appId);
  }

  function login(callback){
    if (calledBeforeInit('login')) return;
    if (FBWorld.state('loggedIn')){
      console.log('FB.login() called when user is already connected.');
      if (FBWorld.state('connected')){
        callback(getStatus());
      }else{
        simulatePromptToConnect(callback);
      }
    }else{
      simulatePromptToLogin(callback);
    }
  }

  function logout(callback){
    if (calledBeforeInit('logout')) return;
    if (!FBWorld.state('loggedIn')) console.log('FB.logout() called without a session.');
    FBWorld.notLoggedIn();
    callback(getStatus());
  }

  function getLoginStatus(callback, perms){
    if (calledBeforeInit('getLoginStatus')) return;
   callback(getStatus());
  }

  function getSession(){
    if (calledBeforeInit('getSession')) return false;
    return getStatus().session;
  }

  function api(location, callback){

    if(!FBWorld.state('connected')){
      callback(undefined);
    }
    if(location == '/me/friends'){
      callback(FBWorld.friendList());
    }
  }

  // FBWorld Functions
  //3 states: loggedOut, loggedIn, connected
  function state(){
    var theState = JSON.parse(FBWorld.Helpers.makeMeACookie('fb-stub') || '{}');
    if (arguments.length === 0) return theState;
    if (arguments.length === 1) return theState[arguments[0]];
    if (arguments.length === 2) {
      theState[arguments[0]] = arguments[1];
      FBWorld.Helpers.makeMeACookie('fb-stub', JSON.stringify(theState));
      return arguments[1];
    }
  }

  function uid(){
    return FBWorld.state('uid');
  }

  function setUid(newUid){
    return FBWorld.state('uid', newUid);
  }

  function setSecret(newSecret){
    return state('secret', newSecret);
  }

  function loggedIn(){
    createConnectedCookie();
    FBWorld.state('loggedIn', true);
    return true;
  }

  function notLoggedIn(){
    deleteConnectedCookie();
    FBWorld.state('loggedIn', false);
  }

  function connected(){
    createConnectedCookie();
    FBWorld.state('connected', true);
  }

  function notConnected(){
    deleteConnectedCookie();
    FBWorld.state('connected', false);
  }

  function addFriend(id, name){
    var friends = FBWorld.friendList();
    friends.push({id: id, name: name});
    FBWorld.Helpers.makeMeACookie('fb_friends', JSON.stringify(friends));
  }

  function friendList(){
    return JSON.parse(FBWorld.Helpers.makeMeACookie('fb_friends') || '[]');
  }

  FB = { // Emulates the FB API
    getLoginStatus : getLoginStatus,
    logout         : logout,
    login          : login,
    init           : init,
    getSession     : getSession,
    api            : api
  };

  FBWorld = { // used to set the state of Facebook
    state        : state,
    loggedIn     : loggedIn,
    notLoggedIn  : notLoggedIn,
    setUid       : setUid,
    setSecret    : setSecret,
    uid          : uid,
    connected    : connected,
    notConnected : notConnected,

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

  // PRIVATE FUNCTIONS

  function getStatus(includePerms) {
    var theState = FBWorld.state();

    // Connected
    if (theState.loggedIn && theState.connected){
      var status = {
        status: "connected",
        session: createConnectedCookie()
      };

      if (includePerms) status.perms = JSON.stringify(theState.perms);
      return status;
    }

    // not connected
    if (theState.loggedIn && !theState.connected){
      return {
        perms: null,
        session: null,
        status: 'notConnected'
      };
    }

    // not logged in
    if (!theState.loggedIn) {
      return {
        perms: null,
        session: null,
        status: 'unknown'
      };
    }

    // var selectedPerms = '{"extended":["status_update","photo_upload","video_upload","offline_access","email","create_note","share_item","publish_stream","contact_email"],"user":["manage_friendlists","create_event","read_requests","manage_pages"],"friends":[]}';

  };

  function calledBeforeInit() {
    if (FBWorld.initialized) return false;
    console.log("FB."+meth+" called before FB.init");
    return true;
  }

  function simulatePromptToLogin(callback) {
    // simulate being prompted to log in
    FBWorld.beingPromptedToLogIn = true;
    FBWorld.beingPromptedToLogInCallback = function(approved){
      FBWorld.beingPromptedToLogin = false;
      FBWorld.beingPromptedToLoginCallback = undefined;
      if(approved){
        FBWorld.loggedIn();
        if (!FBWorld.state('connected')){
          simulatePromptToConnect(callback);
        }else{
          callback(getStatus());
        }
      }else{
        FBWorld.notLoggedIn();
        callback(getStatus());
      }

    };
  };

  function simulatePromptToConnect(callback) {
    // simulate being prompted to connect
    FBWorld.beingPromptedToConnect = true;
    FBWorld.beingPromptedToConnectCallback = function(approved){
      approved ? FBWorld.connected() : FBWorld.notConnected();
      FBWorld.beingPromptedToConnect = false;
      FBWorld.beingPromptedToConnectCallback = undefined;
      callback(getStatus());
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
  function createConnectedCookie(){
    var defaultValues = {
      access_token: 'theToken',
      base_domain: window.location.hostname.replace(/^www\./, ''),
      secret: state('secret') || 'theSecret',
      session_key: 'sessionKey',
      expires: 0,
      uid: state('uid')
    };
    if (uid() != null){
      defaultValues.uid = uid();
    }
    var theState = addSig(defaultValues);
    FBWorld.Helpers.makeMeACookie('fbs_'+state('appId'), cookieToString(theState), cookieOptions);
    return theState;
  }

  function addSig(theState){
    theState['sig'] = FBWorld.Helpers.md5.hex_md5(cookieToString(theState, true));
    return theState;
  }

  function cookieToString(theState, forSig){
    var response = [], fields;
    if (typeof forSig == 'undefined')
      fields = ['access_token', 'base_domain', 'expires', 'secret', 'session_key', 'sig', 'uid'];
    else
      fields = ['access_token', 'base_domain', 'expires', 'secret', 'session_key', 'uid'];
    for (var i =0; i < fields.length; i++){
      var field = fields[i];
      response.push(field + '=' + theState[field]);
    }
    if (typeof forSig != 'undefined'){
      response = response.join('') + theState['secret'];
    }else{
      response = response.join('&');
    }
    return response;
  }
  function deleteConnectedCookie(){
    FBWorld.Helpers.makeMeACookie('fbs_'+state('appId'), null, cookieOptions);
  }


})(this);
FBWorld.Helpers = {};
setTimeout(function() { if (typeof fbAsyncInit === 'function') fbAsyncInit(); }, 1);

