import $ from 'jquery';
import app from '../../app';
import baseVw from '../baseVw';
import ConvoMessage from './ConvoMessage';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a chat messages collection.');
    }

    if (!options.$scrollContainer) {
      // The scroll container should ideally be an ancestor of this view's element.
      throw new Error('Please provide the DOM element that handles scrolling for this view.');
    }

    super(options);
    this.options = options;
    this.$scrollContainer = options.$scrollContainer;
    this.convoMessages = [];

    this.listenTo(app.profile.get('avatarHashes'), 'change', this.render);

    console.log('moonie');
    window.moonie = this;
  }

  className() {
    return 'chatConvoMessages';
  }

  createMessage(model, options = {}) {
    if (!model) {
      throw new Error('Please provide a model.');
    }

    const initialState = {};

    if (model.get('outgoing')) {
      initialState.avatarHashes = app.profile.get('avatarHashes').toJSON();
    }

    const convoMessage = this.createChild(ConvoMessage, {
      ...options,
      model,
      initialState: {
        ...options.initialState,
        ...initialState,
      },
    });

    this.convoMessages.push(convoMessage);

    return convoMessage;
  }

  markMessageAsRead(id) {
    console.log(`called with id: ${id}`);

    if (!id) {
      throw new Error('Please provide an id.');
    }

    const message = this.collection.get(id);

    if (message) {
      message.setState({ showAsRead: true });

      // Only one message should be marked as read, so if there already was one,
      // we'll unmark it.
      if (this.messageMarkedAsRead) {
        const index = this.collection.indexOf(this.messageMarkedAsRead);

        if (index !== -1) {
          this.convoMessages[index].setState({ showAsRead: false });
        }
      }
    }
  }

  render() {
    const messagesContainer = document.createDocumentFragment();

    this.convoMessages.forEach(convoMessage => (convoMessage.remove()));
    this.convoMessages = [];

    this.collection.forEach(message => {
      const convoMessage = this.createMessage(message);
      $(messagesContainer).append(convoMessage.render().el);
    });

    // We only want to mark the last 'read' message as read.
    this.messageMarkedAsRead = this.collection.slice()
      .reverse()
      .find(message => (message.get('read') && message.get('outgoing')));

    const lastReadIndex = this.collection.indexOf(this.messageMarkedAsRead);

    if (lastReadIndex !== -1) {
      this.convoMessages[lastReadIndex].setState({ showAsRead: true });
    }

    this.$el.empty()
      .append(messagesContainer);

    return this;
  }
}
