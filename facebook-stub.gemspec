# -*- encoding: utf-8 -*-
$:.push File.expand_path("../lib", __FILE__)
require "facebook_stub/version"

Gem::Specification.new do |s|
  s.name        = "facebook-stub"
  s.version     = FacebookStub::VERSION
  s.authors     = ["Change.org"]
  s.email       = ["techops@change.org"]
  s.homepage    = ""
  s.summary     = %q{Stub out the FB JS API}
  s.description = %q{facebook-stub is a gem for stubbing out the Facebook JavaScript API in acceptance and integration tests.}

  s.rubyforge_project = "facebook-stub"

  s.files         = `git ls-files`.split("\n")
  s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.executables   = `git ls-files -- pkg/*`.split("\n").map{ |f| File.basename(f) }
  s.require_paths = ["lib"]

  # specify any dependencies here; for example:
  # s.add_development_dependency "rspec"
  # s.add_runtime_dependency "rest-client"
  s.add_development_dependency 'debugger'
  s.add_development_dependency 'sprockets'
  s.add_development_dependency 'rake'
  s.add_development_dependency 'sinatra'
  s.add_development_dependency 'shotgun'
  s.add_development_dependency 'haml'
  s.add_development_dependency 'rspec'
  s.add_development_dependency 'capybara'
  s.add_development_dependency 'jasmine'

end
