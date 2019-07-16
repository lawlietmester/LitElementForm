// @flow
/*::
import typeof Lodash from 'lodash';

type AjaxParameters = {
  'body'?: string,
  'credentials'?: 'omit' | 'same-origin' | 'include',
  'data'?: Object,
  'dataType'?: 'json' | 'text',
  'headers'?: Object,
  'method'?: 'DELETE' | 'GET' | 'POST' | 'PUT'
};

type ErrorWithStatus = Error & {
  'status'?: integer,
  'responseText'?: string
};*/


const _/*: Lodash*/ = window._;


/** Simplified AJAX function, POST by default */
export default async(
  url/*: string*/, params/*: AjaxParameters*/ = {}
)/*: Promise<any>*/ => {
  /** Result options object for fetch */
  const options/*: RequestOptions*/ = { 'method': params.method || 'POST' };

  // Headers
  if( params.headers || options.method === 'POST' ) {
    options.headers =
      params.headers ||
      { 'Content-Type': 'application/x-www-form-urlencoded' };
  }

  // Body
  if( params.data ) {
    options.body = _.transform( params.data, ( carry, value, key ) => {
      carry.push( key + '=' + encodeURIComponent( value ) );
    }, [] ).join( '&' );
  }

  // Credentials
  options.credentials = params.credentials || 'include';

  const dataType/*: string*/ = params.dataType || 'text';

  params = [ 'headers', 'data', 'dataType' ].reduce(
    ( carry, property ) => { delete carry[ property ]; return carry; },
    _.cloneDeep( params )
  );
  // flow ignore next line
  Object.assign( options, params );

  const response/*: Response*/ = await fetch( url, options );

  if( response.ok ) {
    return (
      dataType === 'json'
        ? ( response.json()/*: Promise<Object>*/ )
        : ( response.text()/*: Promise<string>*/ )
    );
  }

  const error/*: ErrorWithStatus*/ = new Error( response.statusText );
  error.status = response.status;
  try {
    error.responseText = await response.text();
  }
  catch ( error ) {}

  throw error;
};
