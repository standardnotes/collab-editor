Collab::Engine.routes.draw do
  
   get "doc/new" => "documents#new"
   get "doc/:uuid" => "documents#show"
   get "doc" => "documents#show"
   post "doc" => "documents#create"

   root "documents#show"
end
