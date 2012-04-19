require 'sinatra/base'
require 'haml'

class TestServer < Sinatra::Base

  ROOT  = Pathname.new(File.expand_path('../..', __FILE__))
  VIEWS = ROOT + "test/views"

  set :views, VIEWS

  get '/javascripts/facebook-stub.js' do
    response['Content-Type'] = "application/javascript"
    File.read ROOT + 'pkg/facebook-stub.js'
  end

  get '/' do
    haml :test
  end

end
