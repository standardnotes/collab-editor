// Action Cable provides the framework to deal with WebSockets in Rails.
// You can generate new channels where WebSocket features live using the rails generate channel command.
//
//= require action_cable
//= require_self
//= require_tree ./channels

document.addEventListener("DOMContentLoaded", function(event) {

  var clientId = Math.random()*100;

  var editor;
  App.registerChainpadObserver = function(inEditor) {
    editor = inEditor;
  }.bind(this)

  var _chainpad, patchText;

  function initChainpad() {
    _chainpad = ChainPad.create({
      checkpointInterval: 3,
      logLevel: 0
    });

    patchText= TextPatcher.create({
      realtime: _chainpad,
    })

    _chainpad.onChange(function (offset, toRemove, toInsert) {
      var currentContent = editor.getContent();
      var newContent = currentContent.substring(0, offset) + toInsert + currentContent.substring(offset + toRemove);

      var op = {offset: offset, toRemove: toRemove, toInsert: toInsert};
      var oldCursor = {};
      oldCursor.selectionStart = cursorToPos(App.editor.getCursor('from'), currentContent);
      oldCursor.selectionEnd = cursorToPos(App.editor.getCursor('to'), currentContent);

      editor.setContent(newContent);

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

    _chainpad.onMessage(function(message, cb){
      var success = App.socket.channel.post(message);
      setTimeout(function () {
        if(!success) {
          console.log("MESSAGE NOT SUCCESSFUL");
        }
        cb();
      }, 1);
    })

    _chainpad.start();
  }

  function getChainpad() {
    return _chainpad;
  }


  App.textEditorDidMakeChanges = function(text) {
    patchText(text);
  }

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

  App.socket = {};
  App.socket.cable = ActionCable.createConsumer("/collab/cable");

  var ignoreNextMessage = false;

  App.socket.subscribeToDoc = function(docId, callback) {
    App.socket.channel = App.socket.cable.subscriptions.create({channel: "EditChannel", doc_id: docId, client_id: clientId}, {
      connected: function() {
        App.socket.channel.retrieve();
      }.bind(this),

      disconnected: function() {
      },

      received: function(data) {
        if(data.client_id == clientId && !data.initial_retrieve) {
          return;
        }

        var patches = [];
        if(data.initial_retrieve) {
          initChainpad();
          patches = data.patches;
        } else if(data.patch) {
          patches = [data.patch];
        }

        patches = patches.map(function(patch){
          return App.crypto.decrypt(patch.content, App.encryptionKey(), patch.iv, patch.auth, App.authKey());
        })

        patches.forEach(function(patch){
          getChainpad().message(patch);
        })
      },

      retrieve: function() {
        return this.perform('retrieve', {doc_id: docId, client_id: clientId});
      },

      post: function(patch) {
        if(ignoreNextMessage) {
          ignoreNextMessage = false;
          return;
        }

        var result = App.crypto.encrypt(patch, App.encryptionKey(), App.authKey());
        var data = {content: result.cipher, iv: result.iv, auth: result.auth, edit_token: App.editToken, doc_id: docId, client_id: clientId};
        return this.perform('post', data);
      }
    });
  };

}.bind(this))
