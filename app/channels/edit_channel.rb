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
    ActionCable.server.broadcast("doc_#{doc.uuid}_#{params['client_id']}", {
      :patches => doc.patches,
      :client_id => data['client_id'],
      :initial_retrieve => true
    })
  end

  def post(data)
    doc = Collab::Document.find_by_uuid(data['doc_id'])
    patch = doc.patches.create({
      :content => data['content'],
      :iv => data["iv"],
      :auth => data["auth"]
    })
    doc.save
    EditChannel.broadcast_to(doc, {:patch => patch, :client_id => data['client_id']})
  end
end
