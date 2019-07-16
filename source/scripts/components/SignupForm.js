// @flow
import checkUsernameRequest from '../requests/checkUsername';
import render from './SignupFormRender';
import signUpRequest from '../requests/signUp';
import { LitElement } from 'lit-element';
import './FormInput';


const emailRegex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


class SignupForm extends LitElement {
  render() {
    return render.call( this );
  }

  // Prperties
  static get properties() {
    return {
      'buttonDisabled': { 'type': Boolean },

      'localErrors': { 'type': Object },
      'remoteErrors': { 'type': Object },
      'globalError': { 'type': String },

      'emailValue': { 'type': String },
      'usernameValue': { 'type': String },
      'passwordValue': { 'type': String },
      'passwordRepeatValue': { 'type': String }
    };
  }

  get buttonDisabled()/*: boolean*/ {
    return (
      Object.keys( this.localErrors ).some( property => this.localErrors[ property ] ) ||
      !this.emailValue || !this.usernameValue || !this.passwordValue || !this.passwordRepeatValue
    );
  }

  constructor() {
    super();

    this.localErrors = {
      'email': '',
      'username': '',
      'password': '',
      'passwordRepeat': ''
    };
    this.remoteErrors = {
      'email': '',
      'username': '',
      'password': '',
      'passwordRepeat': ''
    };
    this.globalError = '';

    this.emailValue = '';
    this.usernameValue = '';
    this.passwordValue = '';
    this.passwordRepeatValue = '';
  }

  // Methods
  /** @method */
  async buttonClick() {
    this.globalError = '';
    this.remoteErrors = {
      'email': '',
      'username': '',
      'password': '',
      'passwordRepeat': ''
    };

    const email/*: string*/ = this.emailValue;
    const username/*: string*/ = this.usernameValue;
    const password/*: string*/ = this.passwordValue;

    try {
      await checkUsernameRequest( username );
    }
    catch ( error ) {
      if( error.needSupport ) {
        this.globalError =
          error.message +
          '. Please try again later. If problem still exists please contact our support at support@support.io';
        return;
      }

      Object.keys( error.data ).forEach( property => {
        if( !( property in this.remoteErrors ) ) return;

        const { message } = error.data[ property ];
        this.remoteErrors = Object.assign(
          {},
          this.remoteErrors,
          { [ property ]: message }
        );
      });
      if( error.data.non_field_errors ) {
        this.globalError = error.data.non_field_errors.message;
      }
      return;
    }

    try {
      await signUpRequest({ username, password, email });

      console.log( 'S U C C E S S' );

      // Fire event for future purposes
      this.dispatchEvent( new CustomEvent( 'complete', {
        'detail': { username, password, email }
      }) );
    }
    catch ( error ) {
      if( error.needSupport ) {
        this.globalError =
          error.message +
          ' Please try again later. If problem still exists please contact our support at support@support.io';
        return;
      }

      Object.keys( error.data ).forEach( property => {
        if( !( property in this.remoteErrors ) ) return;

        const { message } = error.data[ property ];
        this.remoteErrors = Object.assign(
          {},
          this.remoteErrors,
          { [ property ]: message }
        );
      });
      if( error.data.non_field_errors ) {
        this.globalError = error.data.non_field_errors.message;
      }
    }
  }

  /** @method */
  emailComplete({ 'detail': value }/*: { 'detail': string }*/ ) {
    this.emailValue = value;

    this.localErrors = Object.assign(
      {},
      this.localErrors,
      { 'email': !emailRegex.test( value ) ? 'Please specify correct email' : '' }
    );
  }

  /** @method */
  passwordComplete({ 'detail': value }/*: { 'detail': string }*/ ) {
    value = value.trim();
    this.passwordValue = value;

    this.localErrors = Object.assign(
      {},
      this.localErrors,
      { 'password': !value ? 'Please specify password' : '' }
    );
  }

  /** @method */
  passwordRepeatComplete({ 'detail': value }/*: { 'detail': string }*/ ) {
    value = value.trim();
    this.passwordRepeatValue = value;

    this.localErrors = Object.assign(
      {},
      this.localErrors,
      { 'passwordRepeat': value !== this.passwordValue ? 'Passwords do not match' : '' }
    );
  }

  /** @method */
  usernameComplete({ 'detail': value }/*: { 'detail': string }*/ ) {
    value = value.trim();
    this.usernameValue = value;

    this.localErrors = Object.assign(
      {},
      this.localErrors,
      { 'username': !value ? 'Please specify username' : '' }
    );
  }
}
customElements.define( 'signup-form', SignupForm );
