var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('app.properties');

var express = require('express');
var app = express();

var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

//property getter - makes it easy to get a specific app property
getProp = function(property, def = null) {
  var prop = properties.get(property);
  if(prop === null) { //because properties.get(property) returns null if the property does not exist
    prop = def;
  }
  return prop;
};

getMongoUrl = function() {
  return 'mongodb://' +
  getProp('mongo.address', 'localhost') +
  ':' +
  getProp('mongo.port', 27017) +
  '/' +
  getProp('mongo.database', 'uson');
}

var noteSchema = new mongoose.Schema({
  id: {type: String, unique: true, required: true, dropDups: true},
  title: String,
  content: String
});

var Note = mongoose.model('Note', noteSchema);

//connect to the MongoDB database
mongoose.connect(getMongoUrl(), {useNewUrlParser: true});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function() { //we have to wait for the MongoDB connection to open before doing stuff - we won't go anywhere without it anyway
  //log that, please
  console.log('The MongoDB connection to the ' + getProp('mongo.database', 'uson') + ' database at ' + getProp('mongo.address', 'localhost') + ' on port ' + getProp('mongo.port', 27017) + ' is now open.');

  //root endpoint
  app.get("/", function(req, res) {
    //wip
    res.send();
  });

  app.listen(getProp('server.port', 80), function() {
    //good news: we are live ! let's tell the console
    console.log(getProp('app.name', 'Ultra Simple Online Notepad') + ' is listening on port ' + getProp('server.port', 80) + '.');
  });
});
