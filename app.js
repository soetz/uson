var express = require('express');
var app = express();

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('app.properties');

//property getter - makes it easy to get a specific app property
getProp = function(property) {
  return properties.get(property);
};

//root endpoint
app.get("/", function(req, res) {
  //wip
});

app.listen(getProp('server.port'), function() {
  //good news: we are live ! let's tell the console
  console.log(getProp('app.name') + ' is listening on port ' + getProp('server.port'));
});
