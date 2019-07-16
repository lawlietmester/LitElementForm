// @flow
const fs = require( 'fs' );


/** @function */
module.exports = ( filePath/*: string*/ )/*: Promise<string>*/ => new Promise(
  ( resolve, reject ) => {
    fs.readFile( filePath, 'utf8', ( error, text ) => {
      if( error ) { reject( error ); return; }
      resolve( text );
    });
  }
);
