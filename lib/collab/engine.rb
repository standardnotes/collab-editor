module Collab
  class Engine < ::Rails::Engine
    isolate_namespace Collab

    config.assets.precompile += %w( aes.js hmac-sha256.js chainpad.js codemirror.js codemirror.css TextPatcher markdown )
  end
end
