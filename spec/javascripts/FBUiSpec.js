describe("FB.ui", function() {
  beforeEach(function() {
    setup();
  });

  afterEach(function() {
    FBWorld.reset();
  });

  describe("when calling with {method: 'feed'}", function() {
    describe("when loggedIn", function() {

      beforeEach(function() {
        FBWorld.loggedIn();
      });

      it("should set me to beingPromptedToShare", function() {
        FB.ui({method: 'feed'});
        expect(FBWorld.beingPromptedToShare).toBeTruthy();
      });
    });

    describe("when not loggedIn", function () {
      it("should set me to beingPromptedToLogin", function() {
        FB.ui({method: 'feed'});
        expect(FBWorld.beingPromptedToLogin).toBeTruthy();
        expect(FBWorld.beingPromptedToShare).toBeFalsy();

        FBWorld.successfullyLogin(Math.floor(Math.random() * 100000));

        expect(FBWorld.beingPromptedToShare).toBeTruthy();

      });
    });
  });

});
