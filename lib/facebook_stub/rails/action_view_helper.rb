module FacebookStub
  module Rails
    module ActionViewHelper
      @@facebook_javascript_stub = nil
      def include_facebook_stub
        @@facebook_javascript_stub ||= javascript_tag(FacebookStub.javascript)
      end
    end
  end
end
