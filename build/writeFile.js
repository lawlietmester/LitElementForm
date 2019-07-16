// @flow
const fs = require( 'fs' );


/** @function */
module.exports =
  ( filePath/*: string*/, text/*: string*/ )/*: Promise<void>*/ => new Promise(
    ( resolve, reject ) => {
      fs.writeFile( filePath, text, 'utf8', ( error ) => {
        if( error ) reject( error ); else resolve();
      });
    }
  );
