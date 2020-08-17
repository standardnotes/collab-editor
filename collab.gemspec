$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "collab/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "sn-collab-editor"
  s.version     = Collab::VERSION
  s.authors     = ["Standard Notes"]
  s.email       = ["hello@standardnotes.org"]
  s.homepage    = "https://standardnotes.org"
  s.summary     = "Standard Notes editor with collaboration abilities."
  s.description = "Standard Notes editor with collaboration abilities."
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib,vendor}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]

  s.add_dependency "rails", "~> 5"
end
