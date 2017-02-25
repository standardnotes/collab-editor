//= require ./cable.js
//= require ./cryptojs.js

document.addEventListener("DOMContentLoaded", function(event) {

  var textarea, editor, isSubscribedToDoc;
  var isInSN = window.parent != window;

  function getEditorValue() {
    return editor.getDoc().getValue() || "";
  }

  function configureEditor() {
    textarea = document.getElementById("editor");

    editor = App.editor = CodeMirror.fromTextArea(textarea, {
      mode: "text/html",
      lineNumbers: true,
      lineWrapping: true,
      mode: "markdown"
    });

    editor.setSize("100%", "100%");

    editor.on("change", function(cm, change){
      if(isSubscribedToDoc) {
        App.textEditorDidMakeChanges(getEditorValue());
      }
      sendDocToSN()
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
    App.socket.subscribeToDoc(docId, function(message){})
    isSubscribedToDoc = true;
    refreshKey();

    var incomingText = sessionStorage.getItem("sn_text");
    if(incomingText) {
      editor.getDoc().setValue(incomingText);
      sessionStorage.removeItem("sn_text");
    }
  }

  var location = window.location.href;
  var uuidResults = location.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  var uuid = uuidResults ? uuidResults[0] : null;
  var hasDocument = uuid != null;
  var noteId = sessionStorage.getItem("sn_lastNoteId");

  var key, didGenerateKey;

  function refreshKey() {
    if(location.indexOf("#key=") != -1) {
      key = location.split("#key=").slice(-1)[0];
    } else {
      key = App.crypto.generateRandomKey(32);
      didGenerateKey = true;
    }
    setKey(key);
  }

  function setKey(key) {
    App.key = key;

    if(window.location.href.indexOf("#key") == -1) {
      window.history.pushState('Document', 'Document', "#key=" + key);
    }

    if(textarea) {
      var url = window.location.href;
      var etString = "?et=";
      var etIndex = url.indexOf(etString);
      var editingUrl, viewingUrl, editToken;
      if(etIndex != -1) {
        // has edit token
        var editToken = App.editToken = url.substring(etIndex + etString.length, url.indexOf("#"));
        editingUrl = url;
        viewingUrl = url.replace(etString + editToken, "");
      } else {
        // no edit token
        viewingUrl = url;
      }

      var editingElement = document.getElementById("editing-url");
      if(editingUrl) {
        editingElement.innerHTML = editingUrl;
        editingElement.href = editingUrl;
        sendDocToSN();
      } else {
        var editingWrapper = document.getElementById("editing-url-wrapper");
        editingWrapper.parentNode.removeChild(editingWrapper);
      }

      var viewingElement = document.getElementById("viewing-url");
      viewingElement.innerHTML = viewingUrl;
      viewingElement.href = viewingUrl;
    }
  }


  // ** Communication with Standard Notes App **

  function buildParamsString(doc) {
    var string = "";
    for(var key in doc) {
      string += key + ": " + doc[key] + "\n";
    }
    string += "%%Do not modify above this line%%";
    return string;
  }

  function sendDocToSN() {
    if(!isInSN) {
      return;
    }

    var noteBody = buildParamsString({url: window.location.href});
    if(editor) {
      var disclaimer = "// text you enter below will not transfer to the live editor.\n// the below is just a backup for your records";
      noteBody += "\n\n" + disclaimer + "\n\n" + getEditorValue();
    }
    window.parent.postMessage({text: noteBody, id: noteId}, '*');
  }

  if(isInSN) {
    if(hasDocument) {
      // inform parent of new document
      sendDocToSN();
      subscribeToDocId(uuid);
    } else {
      window.parent.postMessage({status: "ready"}, '*');
    }
    window.addEventListener("message", function(event){
      var text = event.data.text || "";
      sessionStorage.setItem("sn_lastNoteId", event.data.id);

      var splitTarget = "%%Do not modify above this line%%";
      var comps = text.split(splitTarget);
      var snText;
      var hasParams = text.indexOf(splitTarget) != -1;
      if(hasParams) {
        snText = comps[1];
      } else {
        snText = text;
        sessionStorage.setItem("sn_text", snText)
      }


      var paramString = comps[0];
      var params = {};
      var lines = paramString.split("\n");
      lines.forEach(function(line){
        var comps = line.split(": ");
        var key = comps[0];
        var value = comps[1];
        params[key] = value;
      })

      let url = params["url"];
      if (url) {
        window.location.href = url;
      } else {
        createNewDocument();
      }
    }, false);
  }

  if(!isInSN){
    if(!hasDocument) {
      createNewDocument();
    } else {
      subscribeToDocId(uuid);
    }
  }

})
