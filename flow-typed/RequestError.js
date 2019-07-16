declare type RequestError = Error & {
  'data'?: { [ string ]: { 'code': string, 'message': string } },
  'needSupport'?: true
};
