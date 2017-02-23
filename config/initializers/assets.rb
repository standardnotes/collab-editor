%w( documents wrapper ).each do |controller|
  Rails.application.config.assets.precompile += ["collab/#{controller}.js", "collab/#{controller}.css"]
end
