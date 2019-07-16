// @flow
const fs = require( 'fs' );
const glob = require( 'glob' );
const gulp = require( 'gulp' );
const mergeStream = require( 'merge-stream' );
const path = require( 'path' );
const readFile = require( './build/readFile' );
const through = require( 'through2' );
const Vinyl = require( 'vinyl' );
const writeFile = require( './build/writeFile' );

const { 'transform': babelTransform } = require( 'babel-core' );
const {
  forkStream,
  getOptimizeStreams,
  HtmlSplitter,
  PolymerProject
} = require( 'polymer-build' );


const directory/*: string*/ = './output';


/** recursive rmdir taken = require( https://gist.github.com/tkihira/2367067
@function */
let rmdir = ( dir/*: string*/ )/*: void*/ => {
  let list/*: Array<string>*/ = fs.readdirSync( dir )
    .map( filename => path.join( dir, filename ) )
    .filter( filename => ![ '.', '..' ].includes( filename ) );

  list.forEach( filename => {
    let stat = fs.statSync( filename );

    if( stat.isDirectory() ) rmdir( filename ); // rmdir recursively
    else fs.unlinkSync( filename ); // rm fiilename
  });
  fs.rmdirSync( dir );
};


gulp.task( 'default', gulp.series(
	// Step 0: clean
	done => {
		if( fs.existsSync( directory ) ) rmdir( directory );
		done();
	},

	// Step 1: polymer-build
	() => {
		let fragments/*: Array<string>*/ = (
			fs.readFileSync( 'source/index.html', 'utf8' )
				.match( /<script type="module" src="[^"]+"><\/script>/g ) || []
		).map( fragment => {
			let matches =
				/<script type="module" src="([^"]+)"><\/script>/.exec( fragment ) || [];
			return ( matches[ 1 ] || '' ).replace( /^\./, 'source' );
		});

		const project = new PolymerProject({
			'entrypoint': 'source/index.html',
			'shell': 'source/scripts/components/FormInput.js',
			fragments,
			'npm': true,
			'moduleResolution': 'node',
			'sources': [ 'source/**/*' ],
			'extraDependencies': [ 'node_modules/@webcomponentsjs/**' ]
		});

		// Fork the two streams to guarentee we are working with clean copies of each
		// file and not sharing object references with other builds.
		let sourcesStream = forkStream( project.sources() );
		let depsStream = forkStream( project.dependencies() );

		// Remove Flow code
		sourcesStream = sourcesStream.pipe(
			through.obj( function( file, encoding, next ) {
				let extension = file.basename.split( '.' ).pop();
				if( extension !== 'js' ) {
					next( null, file ); return;
				}

				let { contents } = file;

				contents = babelTransform( contents, {
					'babelrc': false,
					'presets': []
				}).code;

				next( null, new Vinyl({
					'base': file.base,
					'path': file.path,
					'contents': Buffer.from( contents )
				}) );
			})
		);


		const htmlSplitter = new HtmlSplitter();

		let stream = mergeStream( sourcesStream, depsStream )
			.pipe( project.addCustomElementsEs5Adapter() )
			.pipe( project.bundler({
				'excludes': [
					'/node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js',
					'source/polyfills.js'
				],
				'inlineScripts': false,
				'sourcemaps': false,
				'rewriteUrlsInTemplates': false
			}) )
			.pipe( htmlSplitter.split() );

		getOptimizeStreams({
			'html': {
				'minify': false
			},
			'css': {
				'minify': false
			},
			'js': {
				'compile': false, // No ES5 transpile, otherwise 'es5'
				'minify': false,
				'transformModulesToAmd': true,
				'moduleResolution': project.config.moduleResolution
			},
			'entrypointPath': project.config.entrypoint,
			'rootDir': project.config.root
		}).forEach( transform => { stream = stream.pipe( transform ); });

		return stream
			.pipe( htmlSplitter.rejoin() )
			.pipe( through.obj( function( file, encoding, next ) {
				let { 'relative': filePath, contents } = file;
				if( !filePath.startsWith( 'shared_bundle_' ) ) {
					filePath =
						filePath.replace( /\\/g, '/' ).split( '/' ).slice( 1 ).join( '/' );
				}
				else {
					filePath = filePath.replace( 'shared_bundle_', 'sharedBundle' );
				}

				if( !file.isBuffer() ) {
					throw new Error( 'This is not buffer, time to rewrite build code!' );
				}

				// Ignore all JS files
				if( filePath !== 'index.html' ) {
					contents = contents.toString( 'utf8' ).replace(
						/"(\.\.\/)+shared_bundle_/g, '"/sharedBundle'
					);

					next( null, new Vinyl({
						'path': filePath,
						'contents': Buffer.from( contents )
					}) );
					return;
				}

				// index.html
				let fileNumber = 1;
				contents = contents.toString( 'utf8' ).trim()
					.replace(
						/<script>([\s\S]+?)<\/script>/g,
						( match, scriptContent ) => {
							scriptContent = scriptContent.trim();
							let fileName = ( () => {
								switch( true ) {
									case ( scriptContent.includes( '@@asyncIterator' ) && scriptContent.includes( '[object Generator]' ) ): {
										return 'generatorPolyfills.js';
									}
									case scriptContent.includes( 'window.define=' ): {
										return 'scripts/define.js';
									}
									case scriptContent.startsWith( 'define(' ): {
										return `defineList${String( fileNumber++ ).padStart( 2, '0' )}.js`;
									}
									case scriptContent.includes( 'Symbol.iterator' ): {
										return 'polyfills.js';
									}
									case scriptContent.includes( "document.write('<!--');" ): {
										return 'customElementsDocumentWrite.js';
									}
									default: {
										if( filePath.startsWith( 'shared_bundle_' ) ) {
											return filePath;
										}

										let fileName = `scripts/script${fileNumber}.js`;
										fileNumber++;
										return fileName;
									}
								}
							})();

							this.push( new Vinyl({
								'path': fileName,
								'contents': Buffer.from( scriptContent )
							}) );

							return `<script src="./${fileName}"></script>`;
						}
					)
					.replace(
						/"\/node_modules\/@webcomponents\/webcomponentsjs\//g,
						'"/webcomponentsjs/'
					)
					.replace(
						/<script/,
						'<script src="./scripts/lodash.js"></script>\n' +
						//'<script src="./scripts/polyfills.js"></script>\n' +
						'<script'
					);

				this.push( new Vinyl({
					'path': 'index.html',
					'contents': Buffer.from( contents )
				}) );
				next();
			}) )
			.pipe( gulp.dest( directory ) );
	},

	// Step 2: Merge defineList*.js files
	async( done ) => {
		let list/*: Array<string>*/ = await new Promise( ( resolve, reject ) => {
			fs.readdir( directory, ( error, files ) => {
				if( error ) { reject( error ); return; }
				resolve(
					files
						.filter( fileName => fileName.startsWith( 'defineList' ) )
						.sort()
						.map( fileName => directory + '/' + fileName )
				);
			});
		});
		let defineListTexts/*: Array<string>*/ =
			await Promise.all( list.map( fileName => readFile( fileName ) ) );
		let wholeText/*: string*/ = defineListTexts.join( '\n' );

		await Promise.all( [
			// Create new defineList.js file
			writeFile( directory + '/scripts/defineList.js', wholeText ),

			// Remove all defineList**.js files
			Promise.all( list.map( filePath => new Promise( ( resolve, reject ) => {
				fs.unlink( filePath, error => {
					if( error ) { reject( error ); return; }
					resolve();
				});
			}) ) ),

			// Change index.html
			( async() => {
				let indexHtmlText/*: string*/ =
					await readFile( directory + '/index.html' );
				indexHtmlText = indexHtmlText
					.replace(
						/\s*<script src="\.\/defineList[0-9]+\.js"><\/script>/g, ''
					)
					.replace(
						/<script src="\.\/scripts\/define\.js"><\/script>/,
						'<script src="./scripts/define.js"></script>\n<script src="./scripts/defineList.js"></script>'
					);

				return writeFile( directory + '/index.html', indexHtmlText );
			})()
		] );
	}
) );
