var express = require('express');
var app = express();

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('app.properties');

//property getter - makes it easy to get a specific app property
getProp = function(property, def = null) {
  var prop = properties.get(property);
  if(prop === null) {
    prop = def;
  }
  return prop;
};

//root endpoint
app.get("/", function(req, res) {
  //wip
});

app.listen(getProp('server.port', 80), function() {
  //good news: we are live ! let's tell the console
  console.log(getProp('app.name', 'Ultra Simple Online Notepad') + ' is listening on port ' + getProp('server.port', 80));
});
