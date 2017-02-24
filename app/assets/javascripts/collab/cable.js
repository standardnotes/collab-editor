// Action Cable provides the framework to deal with WebSockets in Rails.
// You can generate new channels where WebSocket features live using the rails generate channel command.
//
//= require action_cable
//= require_self
//= require_tree ./channels

document.addEventListener("DOMContentLoaded", function(event) {

  var clientId = Math.random()*100;

  var chainpad = App.chainpad = ChainPad.create({});

  var currentText = "";

   function posToCursor(position, newText) {
      var cursor = {
          line: 0,
          ch: 0
      };
      var textLines = newText.substr(0, position).split("\n");
      cursor.line = textLines.length - 1;
      cursor.ch = textLines[cursor.line].length;
      return cursor;
  }

  function cursorToPos(cursor, oldText) {
    var cLine = cursor.line;
    var cCh = cursor.ch;
    var pos = 0;
    var textLines = oldText.split("\n");
    for (var line = 0; line <= cLine; line++) {
        if(line < cLine) {
            pos += textLines[line].length+1;
        }
        else if(line === cLine) {
            pos += cCh;
        }
    }
    return pos;
  };

  var observer;
  App.registerChainpadObserver = function(inObserver) {
    observer = inObserver;
  }.bind(this)

  chainpad.onChange(function (offset, toRemove, toInsert) {
    console.log("ON CHANGE");
    var currentContent = observer.getContent();
    var newContent = currentContent.substring(0, offset) + toInsert + currentContent.substring(offset + toRemove);
    console.log("currentContent", currentContent, "newContent", newContent);

    var op = {offset: offset, toRemove: toRemove, toInsert: toInsert};
    var oldCursor = {};
    oldCursor.selectionStart = cursorToPos(App.editor.getCursor('from'), currentContent);
    oldCursor.selectionEnd = cursorToPos(App.editor.getCursor('to'), currentContent);

    // App.patchText(newContent);
    observer.setContent(newContent);
    console.log("SETTING PATCH TEXT STATE", newContent);

    var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
        return TextPatcher.transformCursor(oldCursor[attr], op);
    });

    if(selects[0] === selects[1]) {
        App.editor.setCursor(posToCursor(selects[0], newContent));
    }
    else {
        App.editor.setSelection(posToCursor(selects[0], newContent), posToCursor(selects[1], newContent));
    }
  });

  // chainpad.onPatch(function(patch) {
  //   console.log("ON PATCH", patch);
  //   // chainpad.patch(patch);
  // });

  chainpad.start();

  App.socket = {};
  App.socket.cable = ActionCable.createConsumer("/collab/cable");

  var ignoreNextMessage = false;

  App.socket.subscribeToDoc = function(docId, callback) {
    App.socket.channel = App.socket.cable.subscriptions.create({channel: "EditChannel", doc_id: docId, client_id: clientId}, {
      connected: function() {
        // Called when the subscription is ready for use on the server
        // this.retrieve();
        chainpad.onMessage(function(message, cb){
          console.log("ON MESSAGE", message);
          // App.socket.channel.post(observer.getContent());
          App.socket.channel.post(message);
          setTimeout(function () {
            cb();
          }, 1);
        }.bind(this))
      }.bind(this),

      disconnected: function() {
        // Called when the subscription has been terminated by the server
      },

      received: function(data) {
        // Called when there's incoming data on the websocket for this channel
        if(data.client_id != clientId || data.retrieve) {
          var result = App.crypto.decrypt(data.message, App.encryptionKey(), data.iv, data.auth, App.authKey());
          if(result) {

            // var op = TextPatcher.diff(currentText, result);
            // console.log("received", result, "diff", op);



            chainpad.message(result);

            // ignoreNextMessage = true;
            // console.log("current content", content);
            // var updatedContent = currentText.substring(0, op.offset) + op.toInsert + currentText.substring(op.offset + op.toRemove);
            // observer.setContent(updatedContent);

            // currentText = result;

          }
        }
      },

      retrieve: function() {
        return this.perform('retrieve', {doc_id: docId, client_id: clientId});
      },

      post: function(message) {
        // currentText = message;
        if(ignoreNextMessage) {
          console.log("IGNORING SEND")
          ignoreNextMessage = false;
          return;
        }
        // currentText = message;
        var result = App.crypto.encrypt(message, App.encryptionKey(), App.authKey());
        var data = {message: result.cipher, iv: result.iv, auth: result.auth, doc_id: docId, client_id: clientId};
        return this.perform('post', data);
      }
    });
  };

}.bind(this))
