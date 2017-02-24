module Collab
  class Document < ApplicationRecord
    has_many :patches
  end
end
