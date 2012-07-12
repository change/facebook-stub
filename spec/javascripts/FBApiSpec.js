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

      describe("when a FBWorld.returnError has been set", function() {
        beforeEach(function() {
          FBWorld.forceReturnError('Facebook Error 1');
        });
        it("should callback with the forced error message", function() {
          FB.api('/me/feed', 'post', {}, function (r) {
            expect(r).toEqual('Facebook Error 1');
          });
        });
      });
    });

    describe("when I call FB.api('/me/friends?limit=100', callback)", function() {
      it("should callback with FBWorld.friendList", function() {
        FB.api('/me/friends?limit=100', function (r) {
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

    describe("when I call FB.api('/me/permissions?foo=bar', callback)", function() {
      it("should callback with FBWorld.state.perms", function() {
        FB.api('/me/permissions?foo=bar', function (r) {
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
      it("should push onto FBWorld.published", function() {
        var path = '/me/feed';
        var params = {
          bar: 'baz',
          foobar: 'foo'
        };
        FB.api(path, 'post', params, function (r) {
          expect(FBWorld.lastPostForPath(path)).toEqual(params);
        });
      });
    });

    describe("when I call FB.api('/me/APP_NAMESPACE:ACTION', 'post', params, callback)", function() {
      it("should callback with a random id", function() {
        FB.api('/me/foo:bar', 'post', {}, function (r) {
          expect(r.id).toBeDefined();
        });
      });
      it("should push onto FBWorld.published", function() {
        var path = '/me/foo:bar';
        var params = {
          bar: 'baz',
          foobar: 'foo'
        };
        FB.api(path, 'post', params, function (r) {
          expect(FBWorld.lastPostForPath(path)).toEqual(params);
        });
      });
    });

    describe("when I call FB.api('/', 'post', params, callback)", function() {
      it("should callback with 1 item when passed one item", function() {
        FB.api('/', 'post', { batch: [{
            method: "POST",
            relative_url: "/me/feed",
            body: "message=test"
          }]
        }, function (r) {
          expect(r.length).toEqual(1);
        });
      });

      it("should callback with 2 item when passed two items", function() {
        FB.api('/', 'post', { batch: [{
            method: "POST",
            relative_url: "/me/feed",
            body: "message=test"
          },{
            method: "POST",
            relative_url: "/123/feed",
            body: "message=test"
          }]
        }, function (r) {
          expect(r.length).toEqual(2);
        });
      });
    });

    describe("when I call FB.api(null, 'post', params, callback)", function() {
      it("should callback with a fail message", function() {
        FB.api(null, 'post', {}, function (r) {
          expect(r.error).toBeDefined();
          expect(r.error.code).toBeDefined();
          expect(r.error.message).toBeDefined();
          expect(r.error.type).toBeDefined();
        });
      });

      describe("when a FBWorld.returnError has been set", function() {
        beforeEach(function() {
          FBWorld.forceReturnError('Facebook Error 1');
        });

        it("should callback with the forced error message", function() {
          FB.api(null, 'post', {}, function (r) {
            expect(r).toEqual('Facebook Error 1');
          });
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
