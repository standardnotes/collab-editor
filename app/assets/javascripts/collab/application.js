//= require_self

window.App = window.App || {};

App.encryptionKey = function() {
  return App.key.substring(0, App.key.length/2)
}

App.authKey = function() {
  return App.key.substring(App.key.length/2, App.key.length/2)
}
