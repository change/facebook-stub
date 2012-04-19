module FacebookStub
  module Rails
    module ActionViewHelper
      @@facebook_javascript_stub = nil
      def include_facebook_stub
        @@facebook_javascript_stub ||= javascript_tag File.read File.expand_path('../../../../bin/facebook-stub.js', __FILE__)
      end
    end
  end
end
