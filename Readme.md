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