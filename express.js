const bodyParser = require( 'body-parser' );
const express = require( 'express' );


const app = express();

app.use( bodyParser.urlencoded({ 'extended': false }) );
app.use( bodyParser.json() );


app.get( '/', function( req, res ) {
  res.sendFile( 'output/index.html', { 'root': __dirname });
});


app.post( '/check', function( req, res ) {
  const { username } = req.body;
  if( !username ) {
    res.status( 400 );
    res.json({
      'errors': {
        'username': {
          'code': 'blank',
          'message': 'This field may not be blank.'
        }
      }
    });
  }
  else if( username === 'admin' ) {
    res.status( 400 );
    res.json({
      'errors': {
        'username': {
          'code': 'already_taken',
          'message': 'This name is already taken.'
        }
      }
    });
  }
  else {
    res.status( 200 );
    res.json({ 'ok': true });
  }
});

app.post( '/signup', function( req, res ) {
  const { username, password, email } = req.body;
  if( username && password && email ) {
    res.status( 200 );
    res.json({ 'ok': true });
    return;
  }

  const errors = {};
  const errorData = {
    'code': 'blank',
    'message': 'This field may not be blank.'
  };
  if( !username ) errors.username = errorData;
  if( !password ) errors.password = errorData;
  if( !email ) errors.email = errorData;

  res.status( 400 );
  res.json({ errors });
});


app.use( '/styles', express.static( 'output/styles' ) );
app.use( '/scripts', express.static( 'output/scripts' ) );


app.listen( 3000, function() {
  console.log( 'App listening on port 3000!' );
});
