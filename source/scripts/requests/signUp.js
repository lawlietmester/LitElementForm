// @flow
import ajax from '../tools/ajax';


/** @function */
export default async(
  { username, password, email }/*: { 'username': string, 'password': string, 'email': string }*/
)/*: Promise<void>*/ => {
  let output;
  try {
    output = await ajax( '/signup', {
      'method': 'POST',
      'data': { username, password, email },
      'dataType': 'json'
    });
  }
  catch ( error ) {
    const predictableError/*: RequestError*/ = new Error( 'Predictable error' ); // Flow crap
    try {
      const json = JSON.parse( error.responseText );
      predictableError.data = json.errors || {};
    }
    catch ( parseError ) {
      const outputError/*: RequestError*/ =
        new Error( `Error ${error.status}: ` + error.message );
      outputError.needSupport = true;

      throw outputError;
    }

    throw predictableError;
  }

  if( !output || typeof output !== 'object' || output.ok !== true ) {
    const error/*: RequestError*/ =
      new Error( 'Request /check failed with wrong output' );
    error.needSupport = true;

    throw error;
  }

  // Success
};
