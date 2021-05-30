const electron = require('electron')
const { Sequelize, Model, DataTypes } = require("sequelize");
const bcrypt = require('bcrypt');
const crypto = require('./crypto')
const saltRounds = 10;
// Option 2: Passing parameters separately (other dialects)
// const sequelize = new Sequelize('freedbtech_pchat','freedbtech_aoazEAZEAdaaz', 'aoazEAZEAdaaz', {
//   host: 'freedb.tech',
//   dialect: 'mysql' /*| 'mariadb' | 'postgres' | 'mssql' */
// })
const sequelize = new Sequelize('pchat','pchatClient2', 'abdennour', {
  host: '192.168.43.38',
  dialect: 'mysql', /*| 'postgres' | 'mssql' *//*'mysql'*/ 
  port: 3306})
// const sequelize2 = new Sequelize({
//   dialect: 'sqlite',
//   storage: './db.sqlite'
// });
// const User2 = sequelize2.define('user', {
//   username: DataTypes.STRING,
//   password: DataTypes.STRING
// });
// User2
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const fs = require('fs')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
var currentUser=''
function createWindow () {
  // Create the browser window.

  mainWindow = new BrowserWindow({
    width: 800, 
    height: 600,
    frame: false,
    icon: './img/iconColorBar.png',
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/signin.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  // decryptFile('filename', 'password')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const { ipcMain, ipcRenderer } = require('electron')

// let count = 0;
// ipcMain.on('req-count', (event, arg) => {
//   event.sender.send('res-count', count)
// })
try {
  sequelize.authenticate().then(function () {
    console.log('Connection has been established successfully.')
  })
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

const User = sequelize.define('user', {
  username: DataTypes.STRING,
  password: DataTypes.STRING
});

ipcMain.on('signup', function (event, arg) {
  arg = JSON.parse(arg)
  console.log(arg.username + arg.password)
  User.findAll({
    where: {
      username: arg.username
    }
  }).then(function (user) {
    if (user.length === 0) {
      bcrypt.hash(arg.password, saltRounds, (err, hash) => {
        User.create({ username: arg.username, password: hash }).then(function () {
          console.log(arg.username, ' added to db')
          event.reply('redirect','signin')
        })
        console.log(err)
      })
    } else {
      event.reply('wrongcredmsg')
    }
  })
})
ipcMain.on('signin', function (event, arg) {
  arg = JSON.parse(arg)
  console.log(arg.username + arg.password)
  User.findAll({
    where: {
      username: arg.username
    }
  }).then(function (user) {
    if (user.length > 0) {
      bcrypt.compare(arg.password, user[0].dataValues.password, function (err, res) {
        if(res === true) {
          console.log('connected')
          bcrypt.hash(arg.username, saltRounds, (err, userhash) => {
            setupFiles(arg.username, user[0].dataValues.password)
            encryptFile('./users/' + arg.username + '/' + arg.username + '-user.json', user[0].dataValues.password, '{"username":' + arg.username + '","hash":"' + userhash + '"}')
            event.reply('redirect', 'index')
            currentUser = {'user': 'user', 'friends': 'friends', 'blocked':'blocked', 'convos': 'convos' }
            currentUser.user = {'username': arg.username, "hash": userhash }
            currentUser.friends = decryptFile('./users/' + arg.username + '/' + arg.username + '-friends.json', user[0].dataValues.password)
            currentUser.blocked = decryptFile('./users/' + arg.username + '/' + arg.username + '-blocked.json', user[0].dataValues.password)
            currentUser.convos = decryptFile('./users/' + arg.username + '/' + arg.username + '-convos.json', user[0].dataValues.password)
            // currentUser.friends = [{'username':"abdennour666"}]
            // currentUser.blocked = [{'test':"abdennour666"}]
            // currentUser.convos = {}
            ipcMain.on('logFriends', (event, arg) => {
              encryptFile('./users/' + currentUser.user.username + '/' + currentUser.user.username + '-friends.json', user[0].dataValues.password, JSON.stringify(arg))
              currentUser.friends = decryptFile('./users/' + currentUser.user.username + '/' + currentUser.user.username + '-friends.json', user[0].dataValues.password)
              event.reply("resetFriendsAfterLog",currentUser.friends)
            })
            ipcMain.on('logBlocked', (event, arg) => {
              encryptFile('./users/' + currentUser.user.username + '/' + currentUser.user.username + '-blocked.json', user[0].dataValues.password, JSON.stringify(arg))
              currentUser.blocked = decryptFile('./users/' + currentUser.user.username + '/' + currentUser.user.username + '-blocked.json', user[0].dataValues.password)
              event.reply("resetBlockedAfterLog",currentUser.blocked)
            })
            ipcMain.on('logConvos', (event, arg) => {
              console.log(arg)
              // fs.writeFileSync('./' + currentUser.user.username + '-convos2.json',JSON.stringify(arg))
              encryptFile('./users/' + currentUser.user.username + '/' + currentUser.user.username + '-convos.json', user[0].dataValues.password, arg)
              currentUser.convos = decryptFile('./users/' + currentUser.user.username + '/' + currentUser.user.username + '-convos.json', user[0].dataValues.password)
              event.reply('closeWindows')
            })
            if (err) throw err
          })
        } else {
          console.log(err)
          event.reply('wrongcredmsg')
        }
      })
    } else {
      event.reply('wrongcredmsg')
    }
  })
  // bcrypt.compare(myPlaintextPassword, hash, function(err, res) {
  //   // if res == true, password matched
  //   // else wrong password
  // })
})

function encryptFile (filename, password, content) {
  console.log('test', crypto.encrypt(password, content))
  try {
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename)
    }
  } catch(err) {
    console.error(err)
  }
  console.log("file deleted")
  fs.writeFileSync(filename, crypto.encrypt(password, content))
  console.log("test2")
  // ,function (err) {
  //   if (err) throw err
  //   console.log('crypted!')
  // })
}
// logFile
function decryptFile (filename, password) {
  var c='t'
  // fs.readFileSync(filename, 'utf8', function (err, content) {
  //   if (err) throw err
  //   c = crypto.decrypt(JSON.parse(content), password)
  //   console.log(c)
  // })
  c = crypto.decrypt(JSON.parse(fs.readFileSync(filename, 'utf8')),password)
  console.log('check up',filename,c)
  return JSON.parse(c)
}
function setupFiles (filename,password) {
  try {
    if (!fs.existsSync('./users/')) {
      fs.mkdirSync('./users/')
    }
    if (!fs.existsSync('./users/' + filename)) {
      fs.mkdirSync('./users/' + filename)
    }
    if (!fs.existsSync('./users/' + filename + '/' + filename + '-friends.json')) {
      encryptFile('./users/' + filename + '/' + filename + '-friends.json', password, '[]')
    }
    if (!fs.existsSync('./users/' + filename + '/' + filename + '-blocked.json')) {
      encryptFile('./users/' + filename + '/' + filename + '-blocked.json', password, '[]')
    }
    if (!fs.existsSync('./users/' + filename + '/' + filename + '-convos.json')) {
      encryptFile('./users/' + filename + '/' + filename + '-convos.json', password, '{}')
    }
  } catch(err) {
    console.error(err)
  }
}
ipcMain.on('getUser',function (event) {
  event.reply('setUser', currentUser.user)
})
ipcMain.on('getFriends',function (event) {
  console.log("friends", currentUser.friends)
  event.reply('setFriends', currentUser.friends)
})
ipcMain.on('getBlocked',function (event) {
  console.log("Blocked", currentUser.blocked)
  event.reply('setBlocked', currentUser.blocked)
})
ipcMain.on('getConvos',function (event) {
  console.log("convos", currentUser.convos)
  event.reply('setConvos', currentUser.convos)
})
ipcMain.on('getUsers',function (event) {
  User.findAll().then(function (data) {
    var c=[]
    data.forEach(function (el) {
      c[c.length] = el.dataValues.username
    })
    console.log("friends", c)
    event.reply('setUsers', c)
  })
})
ipcMain.on('addFriend1',function (event,arg) {
  User.findAll({
    where: {
      username: arg
    }
  }).then((res) =>{
    if (res.length === 0) {
      event.reply("UserNotFound", arg)
    } else {
      console.log(res)
      event.reply("addFriend",{'username': arg})
    }
  })
})
ipcMain.on('blockFriend1',function (event,arg) {
  User.findAll({
    where: {
      username: arg
    }
  }).then((res) =>{
    if (res.length === 0) {
      event.reply("UserNotFound", arg)
    } else {
      console.log("blocking main:",arg)
      event.reply("blockFriend",{'username': arg})
    }
  })
})