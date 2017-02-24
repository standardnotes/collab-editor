require_dependency "collab/application_controller"

module Collab
  class DocumentsController < ApplicationController

    def show
      if params[:uuid]
        @doc = Document.find_by_uuid(params[:uuid])
      end
      if !@doc
        return
      end
      @url = url
    end

    def url
      "#{Collab.mount_url}/doc/#{@doc.uuid}"
    end

    def create
      @doc = Document.new
      @doc.uuid = SecureRandom.uuid
      @doc.save
    end

    def new
      @doc = Document.new
      @doc.uuid = SecureRandom.uuid
      @doc.edit_token = Digest::SHA256.hexdigest(SecureRandom.random_bytes())[0,24]
      @doc.save
      redirect_to(url + "?et=#{@doc.edit_token}")
    end

  end
end
