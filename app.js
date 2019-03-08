const PropertiesReader = require('properties-reader');
const properties = PropertiesReader('app.properties');

const express = require('express');

const app = express();
app.use(express.json());
const {check, validationResult} = require('express-validator/check');

const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

//property getter - makes it easy to get a specific app property
getProp = function(property, def = null) {
  const prop = properties.get(property);
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

randomStringAlpha = function(length) {
  const possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";

  for(var i = 0; i < length; i++) {
    result += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return result;
}

const noteSchema = new mongoose.Schema({
  id: {type: String, unique: true, required: true, dropDups: true}, //dropDups makes the query fail if the note you're trying to add has an ID that already exists in the collection
  title: String,
  content: String
});

const Note = mongoose.model('Note', noteSchema);

//connect to the MongoDB database
mongoose.connect(getMongoUrl(), {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function() { //we have to wait for the MongoDB connection to open before doing stuff - we won't go anywhere without it anyway
  //log that, please
  console.log('The MongoDB connection to the ' + getProp('mongo.database', 'uson') + ' database at ' + getProp('mongo.address', 'localhost') + ' on port ' + getProp('mongo.port', 27017) + ' is now open.');

  //route: create new note
  app.post('/', [
    check('title').escape().trim(), //sanitize query title and content fields
    check('content').escape().trim()
  ], function(req, res) {
    const noteId = randomStringAlpha(8); //generate the noteId

    //get the note request title and/or content if they are defined
    const title = (req.body.title) ? req.body.title : "";
    const content = (req.body.content) ? req.body.content : "";

    const newNote = new Note({ //create a new note using the request informations
      id: noteId,
      title: title,
      content: content
    });

    newNote.save(function (error, note) { //and save it
      if (error) {
        res.set('Content-Type', 'text/plain');
        res.status(500).send('There was an unexpected error, sorry for the trouble.'); //there's an error!! tell the querier!
        return console.error(error);
      }

      console.log('uson > New note (id: ' + note.id + ')');
      res.json({ //everything went fine: let's show the wonderful result to the querier
        id: note.id,
        title: note.title,
        content: note.content
      });
    });
  });

  //route: get note information
  app.get('/:noteId', function(req, res) {
    const query = Note.findOne({'id': req.params.noteId}, 'id title content', function(error, note) {
      if(error) {
        res.set('Content-Type', 'text/plain');
        res.status(500).send('There was an unexpected error, sorry for the trouble.'); //there's an error!! tell the querier!
        return console.error(error);
      }

      if(!note) { //can't find that damn note
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Could not find your note, sorry.')
        return console.error('Note ' + req.params.noteId + ' not found');
      }

      console.log('uson > Get note (id: ' + note.id + ')');
      res.json({ //get the querier what it wants
        id: note.id,
        title: note.title,
        content: note.content
      });
    });
  });

  //route: update note
  app.put('/:noteId', [
    check('title').escape().trim(), //sanitize query title and content fields
    check('content').escape().trim()
  ], function(req, res) {
    const update = {$set: {}};
    if(req.body.title) { //update the title only if it is present in the query
      update.$set.title = req.body.title;
    }
    if(req.body.content) { //same for the content
      update.$set.content = req.body.content;
    }

    const query = Note.findOneAndUpdate({'id': req.params.noteId}, update, {new: true}, function(error, note) {
      if(error) {
        res.set('Content-Type', 'text/plain');
        res.status(500).send('There was an unexpected error, sorry for the trouble.'); //there's an error!! tell the querier!
        return console.error(error);
      }

      if(!note) { //can't find that damn note
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Could not find your note, sorry.')
        return console.error('Note ' + req.params.noteId + ' not found');
      }

      console.log('uson > Updated note (id: ' + note.id + ')');
      res.json({ //everything went fine: let's show the wonderful result to the querier
        id: note.id,
        title: note.title,
        content: note.content
      });
    });
  });

  app.listen(getProp('server.port', 80), function() {
    //good news: we are live ! let's tell the console
    console.log(getProp('app.name', 'Ultra Simple Online Notepad') + ' is listening on port ' + getProp('server.port', 80) + '.');
  });
});
