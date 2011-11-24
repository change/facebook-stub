# Facebook JS Stub #

Include facebook-stub.js when in your testing environment, and don't include the facebook all.js

facebook-stub.js creates valid md5 sig cookie which will be passed to the server.

## Overview ##

FacebookStub provides two global objects:

* **FB** emulates the same behavior as the FB object.
* **FBWorld** provides entries to get and set facebook states.

## FBWorld Usage ##

The first think you need to do is FBWorld.setSecret(Your App Secret). This allows the creation of valid cookies.

### Setting State ###

Then you can simulate different user states by using:

    FBWorld.notLoggedIn();
    FBWorld.loggedIn();
    FBWorld.notConnected();
    FBWorld.connected();

### Connecting your app as a user ###
If you are not connected to the application, then when FB.login is called,
you will need to respond with either

    FBWorld.allowConnection(); or
    FBWorld.denyConnection();

The difference between being not being logged in and connecting and being not logged in has not been flushed out yet, as it's purely a facebook state. In terms of the app, you're either connected or not.


### Helper Functions ###
FBWorld provides you with these helper functions for debugging your application state

    FBWorld.state();
    FBWorld.setUid();
    FBWorld.uid();
    FBWorld.beingPromptedToLogin;
    FBWorld.beingPromptedToConnect;

# Forking Instructions #

If you modify facebook-stub.js directly it will be overwritten by builder/concat. Modify src/ files only

# LICENSE: [MIT](http://www.opensource.org/licenses/mit-license.php) #

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
