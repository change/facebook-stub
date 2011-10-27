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
      }else{
        simulatePromptToConnect(callback, options);
      }
    }else{
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
        }else{
          FBWorld.state('perms', 'standard', options.perms);
          callback(getStatus('standard'));
        }
      }else{
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
FBWorld.Helpers.base64_encode = function (data, utf8encode) {
    // http://kevin.vanzonneveld.net
    // +   original by: Tyler Akins (http://rumkin.com)
    // +   improved by: Bayron Guevara
    // +   improved by: Thunder.m
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Pellentesque Malesuada
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Rafał Kukawski (http://kukawski.pl)
    // -    depends on: utf8_encode
    // *     example 1: base64_encode('Kevin van Zonneveld');
    // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
    // mozilla has this native
    // - but breaks in 2.0.0.12!
    //if (typeof this.window['atob'] == 'function') {
    //    return atob(data);
    //}
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    // Only do this if forced
    if (utf8encode)
    data = this.utf8_encode(data + '');

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;

    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);

};
/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

// Modified to make it not use jquery
FBWorld.Helpers.makeMeACookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
          value = '';
          options.expires = -1;
        } else {
          options.expires = 100; // 100 days from now
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = FBWorld.Helpers.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

//Taken from jQuery
FBWorld.Helpers.trim = function( text ) {
  return text == null ?
    "" :
    text.toString().replace( /^\s+/, "" ).replace( /\s+$/, "" );
};
/* A JavaScript implementation of the SHA family of hashes, as defined in FIPS
 * PUB 180-2 as well as the corresponding HMAC implementation as defined in
 * FIPS PUB 198a
 *
 * Version 1.3 Copyright Brian Turek 2008-2010
 * Distributed under the BSD License
 * See http://jssha.sourceforge.net/ for more information
 *
 * Several functions taken from Paul Johnson
 */
(function(){var charSize=8,b64pad="",hexCase=0,str2binb=function(a){var b=[],mask=(1<<charSize)-1,length=a.length*charSize,i;for(i=0;i<length;i+=charSize){b[i>>5]|=(a.charCodeAt(i/charSize)&mask)<<(32-charSize-(i%32))}return b},hex2binb=function(a){var b=[],length=a.length,i,num;for(i=0;i<length;i+=2){num=parseInt(a.substr(i,2),16);if(!isNaN(num)){b[i>>3]|=num<<(24-(4*(i%8)))}else{return"INVALID HEX STRING"}}return b},binb2hex=function(a){var b=(hexCase)?"0123456789ABCDEF":"0123456789abcdef",str="",length=a.length*4,i,srcByte;for(i=0;i<length;i+=1){srcByte=a[i>>2]>>((3-(i%4))*8);str+=b.charAt((srcByte>>4)&0xF)+b.charAt(srcByte&0xF)}return str},binb2b64=function(a){var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"+"0123456789+/",str="",length=a.length*4,i,j,triplet;for(i=0;i<length;i+=3){triplet=(((a[i>>2]>>8*(3-i%4))&0xFF)<<16)|(((a[i+1>>2]>>8*(3-(i+1)%4))&0xFF)<<8)|((a[i+2>>2]>>8*(3-(i+2)%4))&0xFF);for(j=0;j<4;j+=1){if(i*8+j*6<=a.length*32){str+=b.charAt((triplet>>6*(3-j))&0x3F)}else{str+=b64pad}}}return str},rotr=function(x,n){return(x>>>n)|(x<<(32-n))},shr=function(x,n){return x>>>n},ch=function(x,y,z){return(x&y)^(~x&z)},maj=function(x,y,z){return(x&y)^(x&z)^(y&z)},sigma0=function(x){return rotr(x,2)^rotr(x,13)^rotr(x,22)},sigma1=function(x){return rotr(x,6)^rotr(x,11)^rotr(x,25)},gamma0=function(x){return rotr(x,7)^rotr(x,18)^shr(x,3)},gamma1=function(x){return rotr(x,17)^rotr(x,19)^shr(x,10)},safeAdd_2=function(x,y){var a=(x&0xFFFF)+(y&0xFFFF),msw=(x>>>16)+(y>>>16)+(a>>>16);return((msw&0xFFFF)<<16)|(a&0xFFFF)},safeAdd_4=function(a,b,c,d){var e=(a&0xFFFF)+(b&0xFFFF)+(c&0xFFFF)+(d&0xFFFF),msw=(a>>>16)+(b>>>16)+(c>>>16)+(d>>>16)+(e>>>16);return((msw&0xFFFF)<<16)|(e&0xFFFF)},safeAdd_5=function(a,b,c,d,e){var f=(a&0xFFFF)+(b&0xFFFF)+(c&0xFFFF)+(d&0xFFFF)+(e&0xFFFF),msw=(a>>>16)+(b>>>16)+(c>>>16)+(d>>>16)+(e>>>16)+(f>>>16);return((msw&0xFFFF)<<16)|(f&0xFFFF)},coreSHA2=function(j,k,l){var a,b,c,d,e,f,g,h,T1,T2,H,lengthPosition,i,t,K,W=[],appendedMessageLength;if(l==="SHA-224"||l==="SHA-256"){lengthPosition=(((k+65)>>9)<<4)+15;K=[0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0x0FC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x06CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2];if(l==="SHA-224"){H=[0xc1059ed8,0x367cd507,0x3070dd17,0xf70e5939,0xffc00b31,0x68581511,0x64f98fa7,0xbefa4fa4]}else{H=[0x6A09E667,0xBB67AE85,0x3C6EF372,0xA54FF53A,0x510E527F,0x9B05688C,0x1F83D9AB,0x5BE0CD19]}}j[k>>5]|=0x80<<(24-k%32);j[lengthPosition]=k;appendedMessageLength=j.length;for(i=0;i<appendedMessageLength;i+=16){a=H[0];b=H[1];c=H[2];d=H[3];e=H[4];f=H[5];g=H[6];h=H[7];for(t=0;t<64;t+=1){if(t<16){W[t]=j[t+i]}else{W[t]=safeAdd_4(gamma1(W[t-2]),W[t-7],gamma0(W[t-15]),W[t-16])}T1=safeAdd_5(h,sigma1(e),ch(e,f,g),K[t],W[t]);T2=safeAdd_2(sigma0(a),maj(a,b,c));h=g;g=f;f=e;e=safeAdd_2(d,T1);d=c;c=b;b=a;a=safeAdd_2(T1,T2)}H[0]=safeAdd_2(a,H[0]);H[1]=safeAdd_2(b,H[1]);H[2]=safeAdd_2(c,H[2]);H[3]=safeAdd_2(d,H[3]);H[4]=safeAdd_2(e,H[4]);H[5]=safeAdd_2(f,H[5]);H[6]=safeAdd_2(g,H[6]);H[7]=safeAdd_2(h,H[7])}switch(l){case"SHA-224":return[H[0],H[1],H[2],H[3],H[4],H[5],H[6]];case"SHA-256":return H;default:return[]}},jsSHA=function(a,b){this.sha224=null;this.sha256=null;this.strBinLen=null;this.strToHash=null;if("HEX"===b){if(0!==(a.length%2)){return"TEXT MUST BE IN BYTE INCREMENTS"}this.strBinLen=a.length*4;this.strToHash=hex2binb(a)}else if(("ASCII"===b)||('undefined'===typeof(b))){this.strBinLen=a.length*charSize;this.strToHash=str2binb(a)}else{return"UNKNOWN TEXT INPUT TYPE"}};jsSHA.prototype={getHash:function(a,b){var c=null,message=this.strToHash.slice();switch(b){case"HEX":c=binb2hex;break;case"B64":c=binb2b64;break;default:return"FORMAT NOT RECOGNIZED"}switch(a){case"SHA-224":if(null===this.sha224){this.sha224=coreSHA2(message,this.strBinLen,a)}return c(this.sha224);case"SHA-256":if(null===this.sha256){this.sha256=coreSHA2(message,this.strBinLen,a)}return c(this.sha256);default:return"HASH NOT RECOGNIZED"}},getHMAC:function(a,b,c,d){var e,keyToUse,i,retVal,keyBinLen,hashBitSize,keyWithIPad=[],keyWithOPad=[];switch(d){case"HEX":e=binb2hex;break;case"B64":e=binb2b64;break;default:return"FORMAT NOT RECOGNIZED"}switch(c){case"SHA-224":hashBitSize=224;break;case"SHA-256":hashBitSize=256;break;default:return"HASH NOT RECOGNIZED"}if("HEX"===b){if(0!==(a.length%2)){return"KEY MUST BE IN BYTE INCREMENTS"}keyToUse=hex2binb(a);keyBinLen=a.length*4}else if("ASCII"===b){keyToUse=str2binb(a);keyBinLen=a.length*charSize}else{return"UNKNOWN KEY INPUT TYPE"}if(64<(keyBinLen/8)){keyToUse=coreSHA2(keyToUse,keyBinLen,c);keyToUse[15]&=0xFFFFFF00}else if(64>(keyBinLen/8)){keyToUse[15]&=0xFFFFFF00}for(i=0;i<=15;i+=1){keyWithIPad[i]=keyToUse[i]^0x36363636;keyWithOPad[i]=keyToUse[i]^0x5C5C5C5C}retVal=coreSHA2(keyWithIPad.concat(this.strToHash),512+this.strBinLen,c);retVal=coreSHA2(keyWithOPad.concat(retVal),512+hashBitSize,c);return(e(retVal))}};window.FBWorld.Helpers.jsSHA=jsSHA}());
FBWorld.Helpers.utf8_encode = function (argString) {
    // http://kevin.vanzonneveld.net
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: sowberry
    // +    tweaked by: Jack
    // +   bugfixed by: Onno Marsman
    // +   improved by: Yves Sucaet
    // +   bugfixed by: Onno Marsman
    // +   bugfixed by: Ulrich
    // +   bugfixed by: Rafal Kukawski
    // *     example 1: utf8_encode('Kevin van Zonneveld');
    // *     returns 1: 'Kevin van Zonneveld'

    if (argString === null || typeof argString === "undefined") {
        return "";
    }

    var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var utftext = "",
        start, end, stringl = 0;

    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
            end++;
        } else if (c1 > 127 && c1 < 2048) {
            enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
        } else {
            enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.slice(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }

    if (end > start) {
        utftext += string.slice(start, stringl);
    }

    return utftext;
}
