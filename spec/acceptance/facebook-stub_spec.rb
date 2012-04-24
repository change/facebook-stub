require 'spec_helper'

describe "facebook-stub.js" do

  def js_exec script
    page.evaluate_script script
  end

  def logged_in?
    js_exec("FBWorld.state('loggedIn')")
  end

  def being_prompted_to_login?
    js_exec("FBWorld.beingPromptedToLogin")
  end

  def login!(options={})
    js_exec("FB.login(function() {}, #{options.to_json})")
  end

  def successfully_login!
    js_exec("FBWorld.successfullyLogin()")
  end

  def fail_to_login!
    js_exec("FBWorld.failToLogin()")
  end

  def cancel_login!
    js_exec("FBWorld.cancelLogin()")
  end

  def logged_in!
    js_exec("FBWorld.loggedIn('publish_actions')")
  end

  def connected!
    js_exec("FBWorld.connected()")
  end

  def connected?
    js_exec("FBWorld.state('connected')")
  end

  def being_prompted_to_connect?
    js_exec("FBWorld.beingPromptedToConnect")
  end

  def accept_prompt_to_connect!
    js_exec("FBWorld.acceptPromptToConnect()")
  end

  def cancel_prompt_to_connect!
    js_exec("FBWorld.cancelPromptToConnect()")
  end

  def deny_prompt_to_connect!
    js_exec("FBWorld.cancelPromptToConnect()")
  end

  def being_prompted_to_add_permissions?
    js_exec("FBWorld.beingPromptedToAddPermissions")
  end

  def being_prompted_to_add_these_permissions?(perms)
    js_exec("FBWorld.beingPromptedToAddThesePermissions('#{perms}')")
  end

  def accept_prompt_to_add_permissions!(perms=nil)
    if perms
      js_exec("FBWorld.acceptPromptToAddPermissions('#{perms}')")
    else
      js_exec("FBWorld.acceptPromptToAddPermissions()")
    end
  end

  def skip_prompt_to_add_permissions!
    js_exec("FBWorld.skipPromptToAddPermissions()")
  end

  def has_permissions?(perms)
    js_exec("FBWorld.hasPermissions('#{perms}')")
  end

  describe "logging into facebook" do

    before do
      visit '/'
      logged_in?.should be_false
      being_prompted_to_login?.should be_false
      login!
    end

    it "should simulate a login prompt" do
      being_prompted_to_login?.should be_true
    end

    context "when I call FBWorld.successfullyLogin()" do
      before{ successfully_login! }
      it "should make FBWorld.state('loggedIn') true" do
        being_prompted_to_login?.should be_false
        logged_in?.should be_true
        visit '/'
        logged_in?.should be_true
      end
    end

    context "when I call FBWorld.cancelLogin()" do
      before{ cancel_login! }
      it "should make FBWorld.state('loggedIn') false" do
        being_prompted_to_login?.should be_false
        logged_in?.should be_false
        visit '/'
        logged_in?.should be_false
      end
    end

    context "when I call FBWorld.failToLogin()" do
      before{ fail_to_login! }
      it "should make FBWorld.state('loggedIn') false" do
        being_prompted_to_login?.should be_false
        logged_in?.should be_false
        visit '/'
        logged_in?.should be_false
      end
    end
  end

  describe "connecting to facebook" do
    context "when I try login to facebook" do
      before do
        visit '/'
        logged_in!
        logged_in?.should be_true
      end

      context "I should see simulated connect dialogs" do
        before do
          connected?.should be_false
          being_prompted_to_connect?.should be_false
          login!
          logged_in?.should be_true
          being_prompted_to_connect?.should be_true
        end

        context "when I call FBWorld.acceptPromptToConnect()" do
          before { accept_prompt_to_connect! }
          it "should make FBWorld.state('connected') true" do
            being_prompted_to_connect?.should be_false
            connected?.should be_true
            visit '/'
            connected?.should be_true
          end
        end

        context "when I call FBWorld.cancelPromptToConnect()" do
          before { cancel_prompt_to_connect! }
          it "should make FBWorld.state('connected') false" do
            being_prompted_to_connect?.should be_false
            connected?.should be_false
            visit '/'
            connected?.should be_false
          end
        end

        context "when I call FBWorld.denyPromptToConnect()" do
          before { deny_prompt_to_connect! }
          it "should make FBWorld.state('connected') false" do
            being_prompted_to_connect?.should be_false
            connected?.should be_false
            visit '/'
            connected?.should be_false
          end
        end
      end
    end
  end

  describe "adding permissions after being logged in and connected" do

    before do
      visit '/'
      logged_in?.should be_false
      being_prompted_to_login?.should be_false
      logged_in!
      connected!
    end

    context "when I call FB.login with more permissions" do
      before do
        login! :scope => 'perm1,perm2'
      end

      it "should make FBWorld.beingPromptedToAddThesePermissions('perm1') return true" do
        being_prompted_to_add_these_permissions?('perm1,perm2').should be_true
      end

      context "when I call FBWorld.acceptPromptToAddPermissions and accept partial permissions" do
        before do
          accept_prompt_to_add_permissions! 'perm1'
        end

        it "should make hasPermissions('perm1') return true and hasPermissions('perm2') return false" do
          has_permissions?('perm1').should be_true
          has_permissions?('perm2').should be_false
        end

        context "when I call FB.login with more permissions than accepted and the previous accepted permissions" do
          before do
            login! :scope => 'perm1,perm2'
          end

          it "should make FBWorld.beingPromptedToAddThesePermissions('perm2') return true" do
            being_prompted_to_add_these_permissions?('perm2').should be_true
          end

          context "when I call FBWorld.acceptPromptToAddPermissions and accept partial permissions" do
            before do
              accept_prompt_to_add_permissions! 'perm2'
            end

            it "should make hasPermissions('perm1,perm2') return true" do
              has_permissions?('perm1,perm2').should be_true
            end

          end
        end

        context "when I call FB.login with more permissions than accepted" do
          before do
            login! :scope => 'perm2'
          end

          it "should make FBWorld.beingPromptedToAddThesePermissions('perm2') return true" do
            being_prompted_to_add_these_permissions?('perm2').should be_true
          end

          context "when I call FBWorld.acceptPromptToAddPermissions and accept partial permissions" do
            before do
              accept_prompt_to_add_permissions! 'perm2'
            end

            it "should make hasPermissions('perm1,perm2') return true" do
              has_permissions?('perm1,perm2').should be_true
            end

          end
        end

      end

      context "when I call FBWorld.acceptPromptToAddPermissions to accept all permissions" do
        before do
          accept_prompt_to_add_permissions!
        end

        it "should make FBWorld.hasPermissions('perm1,perm2') return true" do
          has_permissions?('perm1,perm2').should be_true
        end

        context "when I call FB.login again" do
          before do
            login! :scope => "perm1,perm2"
          end

          it "should make call to FBWorld.beingPromptedToAddPermissions return false" do
            being_prompted_to_add_permissions?.should be_false
          end
        end
      end

      context "when I call FBWorld.skipPromptToAddPermissions to skip permissions" do
        before do
          skip_prompt_to_add_permissions!
        end

        it "should make FBWorld.beingPromptedToAddThesePermissions('perm1,perm2') return false" do
          being_prompted_to_add_these_permissions?('perm1,perm2').should be_false
        end

        it "should make FBWorld.hasPermissions('perm1,perm2') return false" do
          has_permissions?('perm1,perm2').should be_false
          has_permissions?('perm1').should be_false
          has_permissions?('perm2').should be_false
        end

        context "when I call FB.login again" do
          before do
            login! :scope => 'perm1,perm2'
          end

          it "should make FBWorld.beingPromptedToAddThesePermissions('perm1,perm2') return false" do
            being_prompted_to_add_these_permissions?('perm1,perm2').should be_true
          end
        end

      end

    end
  end
end
