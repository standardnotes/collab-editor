//= require ./cable.js
//= require ./cryptojs.js

document.addEventListener("DOMContentLoaded", function(event) {

  var textarea, editor;

  function getEditorValue() {
    return editor.getDoc().getValue() || "";
  }

  function configureEditor() {
    textarea = document.getElementById("code");
    editor = App.editor = CodeMirror.fromTextArea(textarea, {
      mode: "text/html",
      lineNumbers: true
    });

    editor.on("change", function(cm, change){
      App.textEditorDidMakeChanges(getEditorValue());
    })
  }

  App.registerChainpadObserver({
    getContent: function() {
      return getEditorValue();
    },

    setContent: function(content) {
      editor.getDoc().setValue(content);
    }
  })

  function createNewDocument() {
    window.location.href = "/collab/doc/new";
  }

  function subscribeToDocId(docId) {
    configureEditor();
    App.socket.subscribeToDoc(docId, function(message){
      // editor.getDoc().setValue(message);
    })
  }

  var location = window.location.href;
  var uuidResults = location.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  var uuid = uuidResults ? uuidResults[0] : null;
  var hasDocument = uuid != null;
  var noteId = sessionStorage.getItem("lastNoteId");

  var key, didGenerateKey;
  if(location.indexOf("#key=") != -1) {
    key = location.split("#key=").slice(-1)[0];
  } else {
    key = App.crypto.generateRandomKey(32);
    didGenerateKey = true;
  }
  setKey(key);

  if(window.parent != window) {
    if(hasDocument) {
      // inform parent of new document
      window.parent.postMessage({text: buildParamsString({id: uuid, key: key}), id: noteId}, '*');
      subscribeToDocId(uuid);
    } else {
      window.parent.postMessage({status: "ready"}, '*');
    }
  } else {
    if(!hasDocument) {
      createNewDocument();
    } else {
      subscribeToDocId(uuid);
    }
  }

  function setKey(key) {
    App.key = key;
    var span = document.getElementById("url-key");
    if(span) {
      span.textContent = "#key=" + key;
    }

    if(window.location.href.indexOf("#key") == -1) {
      window.history.pushState('Document', 'Document', "#key=" + key);
    }
  }

  function buildParamsString(doc) {
    var string = "";
    for(var key in doc) {
      string += key + ": " + doc[key] + "\n";
    }
    string += "%%Do not modify above this line%%";
    return string;
  }

  window.addEventListener("message", function(event){

    var text = event.data.text || "";
    sessionStorage.setItem("lastNoteId", event.data.id);

    var paramString = text.split("%%Do not modify above this line%%")[0];
    var lines = paramString.split("\n");
    var params = {};
    lines.forEach(function(line){
      var comps = line.split(": ");
      var key = comps[0];
      var value = comps[1];
      params[key] = value;
    })

    let key = params["key"];
    let docId = params["id"]
    if (docId && docId.length) {
      window.location.href = "/collab/doc/" + docId + "#key=" + key;
    } else {
      createNewDocument();
    }
  }, false);
})
