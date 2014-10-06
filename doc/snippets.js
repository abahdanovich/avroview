// Load native UI library
var gui = require('nw.gui');

// Print arguments
console.log(gui.App.argv);

// Quit current app
gui.App.quit();

// Get the name field in manifest
gui.App.manifest.name

// --------------------

fs = require('fs');

// Read a file:
fileText = fs.readFileSync('foo.txt').toString();

// Write a file:
fs.writeFileSync('bar.txt', fileText);

// Explore a directory:
fs.readdirSync('.')

//-------------------------

os = require('os');

// Number of CPU's
os.cpus().length

// Total CPU System Time
_.chain(os.cpus()).pluck('times').pluck('sys').reduce(function(s,t){
  return s+t;
}).value();

// Free memory
os.freemem();

// --------------------

var gui = require('nw.gui');
var win = gui.Window.get();

var rootMenu = new gui.Menu({
  type: 'menubar'});
var myMenu = new gui.Menu();

myMenu.append(new gui.MenuItem({
  type: 'normal',
  label: 'Debug',
  click: function (){
    win.showDevTools();
  } }));

rootMenu.append(new gui.MenuItem({
  label: 'NW-Reveal',
  submenu: myMenu
}));

rootMenu.append(new gui.MenuItem({
  label: 'NW-Reveal',
  submenu: myMenu
}));

// -----------------

var tray = new gui.Tray({
    icon: 'icon.png'
  });
var menu = new gui.Menu();
menu.append(new gui.MenuItem({
    type: 'checkbox',
    label: 'Always-on-top',
    click: function () {...}
  }));
tray.menu = menu;

// -------------------------

// Open Link in browser
gui.Shell.openExternal('https://intel.com');

// Open a file with default application
gui.Shell.openItem('foo.ext');

// Open a file in finder/file explorer.
gui.Shell.showItemInFolder('/path/to/bar');

// ---------------

var gui = require('nw.gui');
var win = gui.Window.get();

win.hide();
win.show();
win.maximize();
win.minimize();

window.open();
window.moveBy(10,30);
window.resizeTo(800,600);

// --------------------------

