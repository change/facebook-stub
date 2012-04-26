describe("FB.api", function() {
  beforeEach(function() {
    setup();
  });

  afterEach(function() {
    FBWorld.reset();
  });

  describe("when loggedIn, connected, and granted permissions", function() {

    beforeEach(function() {
      FBWorld.loggedIn('publish_actions');
      FBWorld.connected();
    });

    describe("when I call FB.api('/me/friends', callback)", function() {
      it("should callback with FBWorld.friendList", function() {
        FB.api('/me/friends', function (r) {
          expect(r.data).toBeDefined();
          expect(r.data).toEqual(FBWorld.friendList());
        });
      });
    });

    describe("when I call FB.api('/me/permissions', callback)", function() {
      it("should callback with FBWorld.state.perms", function() {
        FB.api('/me/permissions', function (r) {
          expect(r).toBeDefined();
          expect(r.data).toBeDefined();
          expect(r.data).toEqual([FBWorld.state().perms.data]);
        });
      });
    });

    describe("when I call FB.api('/me/feed', 'post', params, callback)", function() {
      it("should callback with a random id", function() {
        FB.api('/me/feed', 'post', {}, function (r) {
          expect(r.id).toBeDefined();
        });
      });
    });

    describe("when I call FB.api('/123/feed', 'post', params, callback)", function() {
      it("should callback with a random id", function() {
        FB.api('/123/feed', 'post', {}, function (r) {
          expect(r.id).toBeDefined();
        });
      });
    });
  });

  describe("when not connected", function () {
    it("should callback with the unconnected error object", function() {
      FB.api('/me/friends', function (r) {
        expect(r).toEqual(apiUnconnectedMessage());
      });
      FB.api('/me/permissions', function (r) {
        expect(r).toEqual(apiUnconnectedMessage());
      });
      FB.api('/me/feed', 'post', {}, function (r) {
        expect(r).toEqual(apiUnconnectedMessage());
      });
    });
  });
});
