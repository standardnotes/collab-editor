class EditChannel < ApplicationCable::Channel
  def subscribed
    doc = Collab::Document.find_by_uuid(params['doc_id'])
    stream_for doc
    stream_from "doc_#{doc.uuid}_#{params['client_id']}"
  end

  def unsubscribed

  end

  def retrieve(data)
    doc = Collab::Document.find_by_uuid(data['doc_id'])
    ActionCable.server.broadcast("doc_#{doc.uuid}_#{params['client_id']}", {:message => doc.content,
      :iv => doc.iv,
      :auth => doc.auth,
      :client_id => data['client_id'],
      :retrieve => true
      })
  end

  def post(data)
    message = data['message']
    doc = Collab::Document.find_by_uuid(data['doc_id'])
    doc.content = message
    doc.iv = data["iv"]
    doc.auth = data["auth"]
    doc.save
    EditChannel.broadcast_to(doc, {:message => message, :iv => data["iv"], :auth => data["auth"], :client_id => data['client_id']})
  end
end
