var gui = require('nw.gui');
var app = gui.App;
var fs = require('fs');

if (app.argv.length < 1) {
  alert("Expected file name as an argument");
  app.quit();
}

var fileText = fs.readFileSync(app.argv[0]).toString();

$(function(){
  $('pre').text(fileText);
});