require "bundler/gem_tasks"
require "rspec/core/rake_task"
require 'pathname'

ROOT = Pathname.new(File.expand_path('..',__FILE__))
LIB  = ROOT + 'lib'
PKG  = ROOT + 'pkg'
BIN  = ROOT + 'bin'

task :build do
  require 'sprockets'
  environment = Sprockets::Environment.new
  environment.append_path LIB.to_s
  source = environment['facebook-stub.js'].source
  BIN.join('facebook-stub.js').open('w'){|f| f.write source }
end

desc "run rspec"
RSpec::Core::RakeTask.new do |t|
  t.pattern = ROOT.join("spec/**/*_spec.rb").to_s
end

task :test => [:build, :spec]

task :default => :test
