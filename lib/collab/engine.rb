module Collab
  class Engine < ::Rails::Engine
    isolate_namespace Collab

    # config.assets.paths << File.expand_path("../../../vendor/assets/javascripts", __FILE__)
    config.assets.precompile += %w( aes.js hmac-sha256.js )
  end
end
