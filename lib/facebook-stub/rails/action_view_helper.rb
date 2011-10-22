module Facebook
  module Stub
    module Rails
      module ActionViewHelper
        @@facebook_javascript_stub = nil
        def include_facebook_stub
          @@facebook_javascript_stub ||= begin
            data = ''
            f = File.open(File.join(*([File.dirname(__FILE__)] + ['..'] * 3 + ['facebook-stub.js'])))
            f.each_line do |line|
              data << line
            end
            f.close
            javascript_tag data
          end
        end
      end
    end
  end
end