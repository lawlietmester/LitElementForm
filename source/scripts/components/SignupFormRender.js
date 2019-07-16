// @flow
import { html } from 'lit-element';


/** @method */
export default function() {
  const { localErrors, remoteErrors } = this;

  return html`
  <style>
  :host{
    display: block;
    font-size: 16px;
  }

  .Field + .Field{
    padding-top: 25px;
  }
  .Label{
    padding-bottom: 5px;
  }
  .Error{
    color: #c00;
    padding-top: 5px;
    font-style: italic;
  }
  .Button{
    padding-top: 40px;
  }
  .Button input{
    border-width: 1px;
    padding: 0 25px;
    font-size: 16px;
    height: 1.8em;
  }

  .Required{
    color: #c00;
  }
  </style>

  <div class="Field">
    <div class="Label">E-mail:<span class="Required">*</span></div>
    <form-input
      .view="${'text'}"
      .firstFocus="${true}"
      .possibleSymbols="${/[_a-z0-9@\.\+\-]/i}"
       @complete="${this.emailComplete}"></form-input>
    ${( () => {
    if( !localErrors.email && !remoteErrors.email ) return '';
    return html`
    <div class="Error">
      ${localErrors.email ? html`<div>${localErrors.email}</div>` : ''}
      ${remoteErrors.email ? html`<div>${remoteErrors.email}</div>` : ''}
    </div>`;
  })()}
  </div>

  <div class="Field">
    <div class="Label">Choose username:<span class="Required">*</span></div>
    <form-input .view="${'text'}" @complete="${this.usernameComplete}"></form-input>
    ${( () => {
    if( !localErrors.username && !remoteErrors.username ) return '';
    return html`
    <div class="Error">
      ${localErrors.username ? html`<div>${localErrors.username}</div>` : ''}
      ${remoteErrors.username ? html`<div>${remoteErrors.username}</div>` : ''}
    </div>`;
  })()}
  </div>

  <div class="Field">
    <div class="Label">Password:<span class="Required">*</span></div>
    <form-input .view="${'password'}" @complete="${this.passwordComplete}"></form-input>
    ${( () => {
    if( !localErrors.password && !remoteErrors.password ) return '';
    return html`
    <div class="Error">
      ${localErrors.password ? html`<div>${localErrors.password}</div>` : ''}
      ${remoteErrors.password ? html`<div>${remoteErrors.password}</div>` : ''}
    </div>`;
  })()}
  </div>
  <div class="Field">
    <div class="Label">Repeat your password:<span class="Required">*</span></div>
    <form-input .view="${'password'}" @complete="${this.passwordRepeatComplete}"></form-input>
    ${( () => {
    if( !localErrors.passwordRepeat && !remoteErrors.passwordRepeat ) return '';
    return html`
    <div class="Error">
      ${localErrors.passwordRepeat
      ? html`<div>${localErrors.passwordRepeat}</div>`
      : ''}
      ${remoteErrors.passwordRepeat
      ? html`<div>${remoteErrors.passwordRepeat}</div>`
      : ''}
    </div>`;
  })()}
  </div>

  ${( () => {
    if( !this.globalError ) return '';
    return html`<div class="Error global">${this.globalError}</div>`;
  })()}

  <div class="Button">
    <input
      type="button"
      value="Sign Up"
      .disabled="${this.buttonDisabled}"
      @click="${this.buttonClick}"/>
  </div>`;
};
