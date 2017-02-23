// Action Cable provides the framework to deal with WebSockets in Rails.
// You can generate new channels where WebSocket features live using the rails generate channel command.
//
//= require action_cable
//= require_self
//= require_tree ./channels

document.addEventListener("DOMContentLoaded", function(event) {

  var clientId = Math.random()*100;

  App.socket = {};
  App.socket.cable = ActionCable.createConsumer("/collab/cable");

  App.socket.subscribeToDoc = function(docId, callback) {
    App.socket.channel = App.socket.cable.subscriptions.create({channel: "EditChannel", doc_id: docId, client_id: clientId}, {
      connected: function() {
        // Called when the subscription is ready for use on the server
        this.retrieve();
      },

      disconnected: function() {
        // Called when the subscription has been terminated by the server
      },

      received: function(data) {
        // Called when there's incoming data on the websocket for this channel
        if(data.client_id != clientId || data.retrieve) {
          var result = App.crypto.decrypt(data.message, App.encryptionKey(), data.iv, data.auth, App.authKey());
          callback(result);
        }
      },

      retrieve: function() {
        return this.perform('retrieve', {doc_id: docId, client_id: clientId});
      },

      post: function(message) {
        var result = App.crypto.encrypt(message, App.encryptionKey(), App.authKey());
        var data = {message: result.cipher, iv: result.iv, auth: result.auth, doc_id: docId, client_id: clientId};
        return this.perform('post', data);
      }
    });
  };

}.bind(this))
