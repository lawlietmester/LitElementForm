import { html, LitElement } from 'lit-element';


class FormInput extends LitElement {
  render() {
    const type = this.view === 'password' ? 'password' : 'text';

    return html`
    <style>
    :host{
      display: block;
    }

    input{
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 0 3px;
      height: 1.8em;
      font-size: 16px;
      border: 1px solid #888;
    }
    input:focus{
      border-color: #000;
    }
    </style>

    <input
      .autofocus="${this.firstFocus}"
      .type="${type}"
      @keydown="${this.keydown}"
      @input="${this.input}"
      @blur="${this.blur}">`;
  }

  static get properties() {
    return {
      'firstFocus': { 'type': Boolean },
      'possibleSymbols': { 'type': Object },
      'timer': { 'type': Number },
      'value': { 'type': String },
      'view': { 'type': String }
    };
  }

  constructor() {
    super();

    this.firstFocus = false;
    this.possibleSymbols = null;
    this.timer = null;
    this.view = 'text';
    this.value = '';
  }

  /** @method */
  blur() {
    if( this.timer ) clearTimeout( this.timer );
    this.makeCompletion();
  }

  /** @method */
  keydown( event ) {
    if( !this.possibleSymbols ) return;

    const { key } = event;
    if( !this.possibleSymbols.test( key ) ) event.preventDefault();
  }

  /** @method */
  input( event ) {
    if( this.timer ) clearTimeout( this.timer );
    this.timer = setTimeout( () => { this.makeCompletion(); }, 1000 );
  }

  /** @method */
  makeCompletion() {
    this.dispatchEvent( new CustomEvent( 'complete', {
      'detail': this.shadowRoot.querySelector( 'input' ).value
    }) );
  }
};
customElements.define( 'form-input', FormInput );
