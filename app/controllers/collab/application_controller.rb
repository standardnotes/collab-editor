module Collab
  class ApplicationController < ActionController::Base
    protect_from_forgery with: :null_session

    after_action :allow_iframe

    def allow_iframe
      response.headers.except! 'X-Frame-Options'
    end

    def wrapper

    end
  end
end
