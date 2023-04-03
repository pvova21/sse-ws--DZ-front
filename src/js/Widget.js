export default class Widget {
  constructor(url) {
    this.url = url;
    this.container = document.querySelector('body');
    this.usersOnline = [];
    this.currentUser = null;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('connected');
    };

    this.ws.onmessage = (evt) => {
      const response = JSON.parse(evt.data);

      if (response.type === 'error') {
        Widget.showError(document.querySelector('.widget'));
      } else if (response.type === 'users') {
        this.usersOnline = response.data;
        this.deleteForm();
        this.showChat();
      } else if (response.type === 'addMes') {
        this.showNewMess(response.data.data);
      } else if (response.type === 'disconnect' || response.type === 'connect') {
        console.log(response.data);
      }
    };

    this.ws.onclose = (event) => {
      if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        console.log('[close] Connection died');
      }
    };

    this.ws.onerror = () => {
      console.log('error');
    };

    window.addEventListener('beforeunload', () => {
      this.ws.send(JSON.stringify({ type: 'deleteUser', user: this.currentUser }));
    });
  }

  createForm() {
    const form = document.createElement('form');
    form.classList.add('widget');
    form.innerHTML = ` <h2>Выберите псевдоним</h2>
        <input class="input widget-input" type="text" name="nick" placeholder="Например, Ann" required>
        <button type="submit" class="btn">Продолжить</button>`;

    this.container.insertAdjacentElement('afterbegin', form);

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nickName = form.nick.value;
      const response = { type: 'addUser', user: nickName };
      this.currentUser = nickName;
      this.ws.send(JSON.stringify(response));
    });

    form.querySelector('.widget-input').addEventListener('input', () => {
      Widget.deleteError();
    });
  }

  static showError(form) {
    const input = form.querySelector('.widget-input');
    input.focus();

    const error = document.createElement('div');
    error.classList.add('widget-error');
    error.textContent = 'Такой никнейм уже занят, выберите другой';

    input.insertAdjacentElement('afterend', error);
  }

  static deleteError() {
    if (document.querySelector('.widget-error')) {
      document.querySelector('.widget-error').remove();
    }
  }

  deleteForm() {
    this.container.removeChild(this.container.firstChild);
  }

  showChat() {
    if (!document.querySelector('.container')) {
      const container = document.createElement('div');
      container.classList.add('container');

      container.innerHTML = `<section class="chat-users"></section>
            <section class="chat">
             <div class="chat-content"></div>
            
                <form class="chat-form">
                    <input class="input chat-form-input" type="text" aria-label="Ваше сообщение" name="message" placeholder="Напишите что-нибудь" required>
                </form>
            </section>`;

      this.container.appendChild(container);

      const chatForm = container.querySelector('.chat-form');

      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatForm.message.value;
        const time = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().slice(0, -3)}`;
        this.ws.send(JSON.stringify({
          type: 'addMes',
          data: {
            name: this.currentUser,
            message,
            time,
          },
        }));

        chatForm.message.value = '';
      });
    }

    this.showUsers();
  }

  showUsers() {
    const users = document.querySelector('.chat-users');
    users.innerHTML = '';

    this.usersOnline.forEach((user) => {
      const userItem = document.createElement('div');
      userItem.classList.add('user');
      userItem.innerHTML = `<div class="user-avatar">
            <i class="far fa-user-circle fa-2x"></i>
        </div>`;

      const userName = document.createElement('div');
      userName.classList.add('user-name');
      userName.textContent = user.name;

      if (user.name === this.currentUser) {
        userName.textContent = 'You';
      }

      userItem.appendChild(userName);

      users.appendChild(userItem);
    });
  }

  showNewMess(data) {
    const message = this.createMessage(data);
    this.container.querySelector('.chat-content').appendChild(message);
  }

  createMessage(data) {
    const newMes = document.createElement('div');
    newMes.classList.add('chat-message');

    newMes.innerHTML = ` <div class="mes-top"><span class="chat-message-name"></span>
            <span class="chat-message-time">${data.time}</span></div>
            <div class="chat-mes-content">${data.message}</div>`;

    const userChatName = newMes.querySelector('.chat-message-name');

    if (data.name === this.currentUser) {
      userChatName.textContent = 'You';
      newMes.classList.add('you-mes');
    } else {
      newMes.classList.remove('you-mes');
      userChatName.textContent = data.name;
    }

    return newMes;
  }
}
