const { ipcRenderer } = require('electron')
ipcRenderer.send('getUser')
var user = ''
function windowClose(win) {
  // var a = win.localStorage.length === 0 ? {} : win.localStorage
  // ipcRenderer.send('logData', 'convos = '+ JSON.stringify(a))
  win.close();
}
function signin (e) {
  var username = $('#usernameInput').val()
  var password = $('#passwordInput').val()
  if (username.trim() !== '' && password.trim() !== '') {
    ipcRenderer.send('signin', JSON.stringify({ 'username': username, 'password': password }))
  } else {
    $('#wrongcredmsg').css('display','block')
  }
  e.preventDefault()
  return false
}
function signup (e) {
  var username = $('#usernameInput').val()
  var password = $('#passwordInput').val()
  var confirmPassword = $('#confirmPasswordInput').val()
  if (password !== confirmPassword) {
    $('#passconfmsg').css('display','block')
  } else {
    if (username.trim() !== '' && password.trim() !== '') {
      ipcRenderer.send('signup', JSON.stringify({ 'username': username, 'password': password }))
    } else {
      $('#wrongcredmsg').css('display','block')
    }
  }
  e.preventDefault()
  return false
}
ipcRenderer.on('wrongcredmsg',function () {
  $('#wrongcredmsg').css('display','block')
})
ipcRenderer.on('redirect',(event,arg) => {
  window.location.href = './' + arg + '.html'
})