// var key="aiubjlnkda12GJCHV-uyfUTCJ67YVHYUADhjvuvjHYHVJJKYUVvjyyvdaé&é&é14141"

var missing = {}
var user = {}
var friends = {}
var blocked = {}

function restorOldChat () {
  var chat = JSON.parse(JSON.stringify(window.localStorage))
  console.log(chat)
  Object.keys(chat).forEach(function (el) {
    chat[el] = JSON.parse(chat[el])
  })
  console.log(chat)
  return chat
}

function myjsapp(peerClient) {
  var chatHistory = {}
  ipcRenderer.send('getConvos')
  ipcRenderer.on('setConvos',function (event,arg) {
    // arg= JSON.parse(arg)
    console.log('here convos',arg)
    Object.keys(arg).forEach(function (el) {
      window.localStorage.setItem(el, arg[el])
    })
    chatHistory = restorOldChat()
  })
  ipcRenderer.send('getUser')
  ipcRenderer.on('setUser',function (event,arg) {
    console.log(arg)
    user.username = arg.username
    user.hash = arg.hash
    if (user.username !== '') {
      startPeerClient(user.username)
    } else {
      window.location.href = './signin.html'
    }
  })
  ipcRenderer.send('getFriends')
  ipcRenderer.on('setFriends',function (event,arg) {
    console.log(arg)
    friends = arg
  })
  ipcRenderer.on('resetFriendsAfterLog',function (event,arg) {
    console.log(arg)
    friends = arg
  })
  ipcRenderer.send('getBlocked')
  ipcRenderer.on('setBlocked',function (event,arg) {
    console.log("are we empty", arg)
    blocked = arg
  })
  ipcRenderer.on('resetBlockedAfterLog',function (event,arg) {
    console.log("are we empty", arg)
    blocked = arg
  })
  ipcRenderer.on('addFriend',function (event,arg) {
    console.log(arg)
    var ex = friends.indexOf()
    if(ex === -1) {
      friends[friends.length] = arg
      ipcRenderer.send('logFriends',friends)
    }
  })
  ipcRenderer.on('blockFriend',function (event,arg) {
    console.log("blocking app:",arg)
    var ex = blocked.indexOf(arg)
    if(ex === -1) {
      blocked[blocked.length] = arg
      ipcRenderer.send('logBlocked',blocked)
    }
  })
  console.log(user)
  function appendToHistory(id, message, isSent,backup) {
    var fromTxt = isSent ? 'You' : id
    if(backup) {
      chatHistory[id][chatHistory[id].length] = {'peer':fromTxt, 'message':message}
      console.log(chatHistory[id])
      window.localStorage.setItem(id, JSON.stringify(chatHistory[id]))
    }
    console.log($('#com-id-head'))
    if(!isSent && id !== $('#com-id-head').text()) {
      // $('#' + $('#com-id-head').text()).addClass("notif")
      if(missing[id]) {
        missing[id] = missing[id]+1
      }else{
        missing[id] = 1
      }
    }else{
      var hist = $('.chatHistory')
      var orientation = (fromTxt === 'You') ? 'right' : 'left'
      var msg = $('<div class="' + orientation + '"><p class="pseudo">' +
        fromTxt + '</p><p class="message" id="' + orientation +'">' + message + '</p></div>')
      hist.append(msg).scrollTop(hist[0].scrollHeight)
    }
  }
  function createChatWin(id,newFriend) {
    var toPeerId = id
    var title = $('#com-id-head').text(toPeerId)
    var message = $('.msg-input')
    var sendBtn = $('.send')
    var chat = $('.chatHistory')
    delete missing[id]
    console.log(toPeerId)
    chat.empty()
    if (!chatHistory[id]) {
      chatHistory[id]=[]
    }
    // console.log(chatHistory)
    chatHistory[toPeerId].forEach(function (el) {
      var sender = (el.peer !== toPeerId)
      appendToHistory(el.peer,el.message,sender,false)
    })
    // if (!newFriend) {
    //   $('#add').attr('hidden')
    // } else {
    //   $('#add').removeAttr('hidden')
    // }
    message.keypress(function (event) {
      var key = event. keyCode || event. charCode;
      if (key == 13) {
        var msgText = message.text().trim()
        if (msgText) {
          var xid = $('#com-id-head').text()
          console.log('sending to:' + xid)
          peerClient.sendMessage(xid, msgText)
          appendToHistory(xid, msgText, true, true)
          $(this).text('')
          event.preventDefault()
          return false
        }
      }
      var regex = new RegExp('[<>]+$');
      key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
      if (regex.test(key)) {
        event.preventDefault()
        return false
      }

    });
    sendBtn.click(function (event) {
      var msgText = message.text().trim()
      if (msgText) {
        var xid = $('#com-id-head').text()
        console.log('sending to:' + xid)
        peerClient.sendMessage(xid, msgText)
        appendToHistory(xid, msgText, true, true)
        message.text('').focus()
      }
    })
  }
  function EventListeners () {
    $('#peer-id').tooltip()

    function connectToPeer (id) {
      id = id.trim()
      if (id) {
        peerClient.connectToId(id.toLowerCase())
        createChatWin(id)
        // $('.send').click(function (event) {
        //   var msgText =$('.msg-input').text().trim()
        //   if (msgText) {
        //     console.log(id.toLowerCase())
        //     peerClient.sendMessage(id.toLowerCase(), msgText)
        //     // appendToHistory(id, id, true, true)
        //     $('.msg-input').text('').focus()
        //   }
        // })
      }
    }
    console.log("1")
    $(document).on('click', '.friend', function () {
      var id = $($(this)[0].childNodes[2]).text()
      $('.chatHistory').empty()
      console.log(id + ':')
      connectToPeer(id,"")
    });
    Element.prototype.remove = function () {
      this.parentElement.removeChild(this);
    }
    $('#peer-id').click(function (event) {
      var textArea = document.createElement("textarea");
      // Avoid flash of white box if rendered for any reason.
      textArea.style.background = 'transparent';
      textArea.value = $(this).text();
      document.body.appendChild(textArea);
      textArea.select();

      try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
        textArea.remove();
      } catch (err) {
        console.log('Oops, unable to copy');
      }
    })
  }
  
  function startPeerClient(username) {
    // TODO - Set title
    peerClient.connectToServerWithId(username);
  }
  console.log(user)
  EventListeners()
  return {
    setPeerId: function (id) {
      $('#peer-id').text(id)
    },
    createChatWindow: createChatWin,
    appendHistory: appendToHistory,
    closeChatWindow: function (id) {
      
    },
    showError: function (msg) {

    },
    updateOnlieUsers: function (users) {
      var list = $('.friendlist')
      console.log(list)
      list.empty()
      var friendlist = friends
      var blockedlist = blocked
      console.log("we are the friends", friends)
      console.log("we are the blocked", blocked)
      var output=[]
      for (var i=0; i < blockedlist.length ; i++) {
        output[i] = blocked[i].username
      }
      console.log(output)
      friendlist  = friendlist.filter(fr => !output.includes(fr.username))
      console.log(friendlist)
      var usr = ''
      friendlist.forEach(function (f) {
        var notif = ''
        var missmsg = ''
        if (missing[f.username]) {
          notif = 'notif'
          missmsg = missing[f.username]
        }
        if (users.includes(f.username)) {
          usr = '<div class="row friend" ><span class="friend-avatar"><i class="fas fa-user"></i></span><span class="connected ' + notif + '" >' + missmsg + '</span><span class="com-id-head" style="margin:auto 0;padding:0 10px">' + f.username + '</span></div><hr style="height:1px; background:#3A3B3C; width:90%;margin:10px auto;">'
        } else {
          usr = '<div class="row friend" ><span class="friend-avatar"><i class="fas fa-user"></i></span><span class="disconnected ' + notif + '" >' + missmsg + '</span><span class="com-id-head" style="margin:auto 0;padding:0 10px">' + f.username + '</span></div><hr style="height:1px; background:#3A3B3C; width:90%;margin:10px auto;">'
        }
        list.append(usr)
      })
    }
  }
}
var myapp, peerapp;

$(document).ready(function () {
  myapp = myjsapp(peerapp);
});