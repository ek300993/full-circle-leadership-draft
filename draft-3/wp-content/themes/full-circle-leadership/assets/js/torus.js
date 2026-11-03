/**
 * A real 3D torus, the cover's ring as an object.
 *
 * Renders each [fcl_torus] element with plain WebGL (no library): the cover's blue under
 * a glossy lacquer that reflects a soft studio (a pale ceiling, the lavender floor, a bright
 * softbox at the upper left), with crisp highlights and a faint split of colour at its very
 * edge, a nod to the cover's refraction. It holds still, facing straight
 * at the viewer, and is redrawn only when its size or settings change. Colours come from the theme palette.
 * Without WebGL nothing is drawn and whatever sits behind it (a flat ring) remains.
 *
 * By default it takes the colours and satin gloss of the ring on the book cover;
 * data-tone="sky" gives a softer, lighter version; data-reflect (0 to 1.5, default 1) sets how glossy it is, data-roughness (0 to 1, default 0.2) how soft its highlights are,
 * data-light (0.2 to 2, default 1) how bright the light on it is, data-angle the light's
 * direction in degrees clockwise from the top (default -30, upper left), and data-bottom
 * (0 to 1, default 0.3) a soft light from below. data-color (#rrggbb) replaces the tone with
 * any colour, its lit side and shadow derived from it. data-mirror="1" adds a soft reflection
 * below the ring, as on the cover. data-fringe (px) splits its edges into colour, cyan to the left and
 * rose to the right, like a lens's chromatic aberration. data-thickness sets the tube's radius against the ring's (0.11, as on the cover).
 *
 * @package full-circle-leadership
 */
( function () {
	var hosts = document.querySelectorAll( '.fcl-torus' );
	if ( ! hosts.length ) {
		return;
	}

	var VERT = [
		'attribute vec3 aPos;',
		'attribute vec3 aNor;',
		'uniform mat4 uModel;',
		'uniform mat4 uProj;',
		'uniform mat3 uNormal;',
		'varying vec3 vN;',
		'varying vec3 vP;',
		'varying vec3 vLocal;',
		'void main() {',
		'  vec4 wp = uModel * vec4(aPos, 1.0);',
		'  vP = wp.xyz;',
		'  vN = normalize(uNormal * aNor);',
		'  vLocal = aPos;',
		'  gl_Position = uProj * wp;',
		'}'
	].join( '\n' );

	var FRAG = [
		'precision highp float;',
		'varying vec3 vN;',
		'varying vec3 vP;',
		'varying vec3 vLocal;',
		'uniform vec3 uLight;',
		'uniform vec3 uMid;',
		'uniform vec3 uDeep;',
		'uniform vec3 uGlint;',
		'uniform vec3 uGround;',
		'uniform vec3 uCyan;',
		'uniform vec3 uRose;',
		'uniform float uPrism;',
		'uniform float uReflect;',
		'uniform float uRough;',
		'uniform float uBright;',
		'uniform float uTurn;',
		'uniform float uBottom;',
		// Turns a light direction round the view axis, clockwise from its default upper-left place.
		'vec3 turn(vec3 v) { float c = cos(uTurn), s = sin(uTurn); return vec3(v.x * c + v.y * s, -v.x * s + v.y * c, v.z); }',
		// A soft studio around the ring: a pale ceiling, the lavender floor, a bright horizon,
		// and two softboxes, the big one at the upper left where the cover's light comes from.
		'vec3 studio(vec3 R) {',
		'  vec3 c = mix(uGround * 0.85, mix(uGlint, vec3(1.0), 0.4), smoothstep(-0.35, 0.65, R.y));',
		'  c += vec3(1.0) * exp(-pow(R.y * 7.0, 2.0)) * 0.25;',
		'  c += uGlint * smoothstep(0.86 - 0.3 * uRough, 0.94, dot(R, normalize(turn(vec3(0.75, 0.15, 0.6))))) * 0.6;',
		'  return c;',
		'}',
		'void main() {',
		'  vec3 N = normalize(vN);',
		'  vec3 V = normalize(-vP);',
		'  vec3 L = normalize(turn(vec3(-0.45, 0.8, 0.45)));',
		'  float ndl = dot(N, L);',
		// The blue body underneath the lacquer, as on the cover.
		'  vec3 col = mix(uDeep, uMid, smoothstep(-0.25, 0.55, ndl));',
		'  col = mix(col, uLight, smoothstep(0.55, 0.95, ndl) * 0.6);',
		// Light brightness: the key light lifts or dims the body, its reflections and highlights together.
		'  col *= 0.45 + 0.55 * uBright;',
		// A glossy lacquer over it: the studio reflected, strongest at grazing angles.
		'  vec3 R = reflect(-V, N);',
		'  float cosv = max(dot(N, V), 0.0);',
		'  float fresnel = 0.06 + 0.94 * pow(1.0 - cosv, 5.0);',
		'  float k = clamp((0.1 + 0.8 * fresnel * (1.0 - 0.5 * uRough)) * uReflect, 0.0, 1.0);',
		'  vec3 env = studio(R) * (0.5 + 0.5 * uBright);',
		'  col = mix(col, col * 0.6 + env * mix(uMid, vec3(1.0), 0.45) * 0.8, k);',
		// The big softbox at the upper left, reflected as a crisp bright band.
		// Rougher surfaces spread the softbox into a broader, dimmer sheen.
		'  col += vec3(1.0) * smoothstep(0.66 - 0.4 * uRough, 0.82 + 0.1 * uRough, dot(R, normalize(turn(vec3(-0.55, 0.65, 0.5))))) * (0.75 - 0.4 * uRough) * uReflect * uBright;',
		// Crisp highlights from the key light, on top of the reflection.
		'  vec3 H = normalize(L + V);',
		'  float nh = max(dot(N, H), 0.0);',
		'  col += vec3(1.0) * (pow(nh, mix(140.0, 22.0, uRough)) * mix(0.9, 0.4, uRough) + pow(nh, mix(28.0, 8.0, uRough)) * 0.18) * uReflect * uBright;',
		// A soft light from below: a gentle glow on the underside and a pale reflected rim along it.
		'  float under = max(dot(N, normalize(vec3(0.0, -0.85, 0.45))), 0.0);',
		'  col += mix(uMid, uLight, 0.6) * under * under * 0.45 * uBottom;',
		'  col += mix(uLight, vec3(1.0), 0.5) * smoothstep(-0.5, -0.85, R.y) * (0.35 - 0.15 * uRough) * uBottom;',
		// A faint split of colour at the very edge, the cover's refraction in a whisper.
		'  float fr = pow(1.0 - cosv, 2.5);',
		'  vec3 prism = mix(uCyan, uRose, 0.5 + 0.5 * sin(atan(vLocal.y, vLocal.x) * 2.0 + fr * 5.0));',
		'  col = mix(col, prism, fr * fr * uPrism);',
		'  float luma = dot(col, vec3(0.299, 0.587, 0.114));',
		'  col = mix(vec3(luma), col, 1.15);',
		'  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
		'}'
	].join( '\n' );

	function rgb( value, fallback ) {
		var c = ( value || '' ).trim();
		var hex = /^#([0-9a-f]{6})$/i.exec( c );
		if ( hex ) {
			var n = parseInt( hex[ 1 ], 16 );
			return [ ( ( n >> 16 ) & 255 ) / 255, ( ( n >> 8 ) & 255 ) / 255, ( n & 255 ) / 255 ];
		}
		var m = c.match( /[\d.]+/g );
		return m && m.length >= 3 ? [ m[ 0 ] / 255, m[ 1 ] / 255, m[ 2 ] / 255 ] : fallback;
	}
	function mix( a, b, t ) {
		return [ a[ 0 ] + ( b[ 0 ] - a[ 0 ] ) * t, a[ 1 ] + ( b[ 1 ] - a[ 1 ] ) * t, a[ 2 ] + ( b[ 2 ] - a[ 2 ] ) * t ];
	}

	// Column-major 4x4 matrices, just what the scene needs.
	function perspective( fov, aspect, near, far ) {
		var f = 1 / Math.tan( fov / 2 ), nf = 1 / ( near - far );
		return [ f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, ( far + near ) * nf, -1, 0, 0, 2 * far * near * nf, 0 ];
	}
	function translate( z ) { return [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1 ]; }

	// A torus around the z axis: ring radius R, tube radius r.
	function torusMesh( R, r, seg, tube ) {
		var pos = [], nor = [], idx = [];
		for ( var i = 0; i <= seg; i++ ) {
			var u = ( i / seg ) * Math.PI * 2, cu = Math.cos( u ), su = Math.sin( u );
			for ( var j = 0; j <= tube; j++ ) {
				var v = ( j / tube ) * Math.PI * 2, cv = Math.cos( v ), sv = Math.sin( v );
				pos.push( ( R + r * cv ) * cu, ( R + r * cv ) * su, r * sv );
				nor.push( cv * cu, cv * su, sv );
			}
		}
		for ( i = 0; i < seg; i++ ) {
			for ( j = 0; j < tube; j++ ) {
				var a = i * ( tube + 1 ) + j, b = a + tube + 1;
				idx.push( a, b, a + 1, b, b + 1, a + 1 );
			}
		}
		return { pos: new Float32Array( pos ), nor: new Float32Array( nor ), idx: new Uint16Array( idx ) };
	}

	function compile( gl, type, src ) {
		var s = gl.createShader( type );
		gl.shaderSource( s, src );
		gl.compileShader( s );
		return gl.getShaderParameter( s, gl.COMPILE_STATUS ) ? s : null;
	}

	function init( host ) {
		var canvas = document.createElement( 'canvas' );
		var gl = canvas.getContext( 'webgl', { alpha: true, antialias: true, premultipliedAlpha: true } );
		if ( ! gl ) {
			return;
		}
		var vs = compile( gl, gl.VERTEX_SHADER, VERT ), fs = compile( gl, gl.FRAGMENT_SHADER, FRAG );
		if ( ! vs || ! fs ) {
			return;
		}
		var prog = gl.createProgram();
		gl.attachShader( prog, vs );
		gl.attachShader( prog, fs );
		gl.linkProgram( prog );
		if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS ) ) {
			return;
		}
		host.appendChild( canvas );
		gl.useProgram( prog );

		// data-mirror: the ring's reflection, a flipped copy of each frame laid below it (styled in CSS).
		var mirror = null, mctx = null;
		function setMirror() {
			var on = /^(1|true|yes)$/.test( host.getAttribute( 'data-mirror' ) || '' );
			if ( on && ! mirror ) {
				mirror = document.createElement( 'canvas' );
				mirror.className = 'fcl-torus__mirror';
				host.appendChild( mirror );
				mctx = mirror.getContext( '2d' );
			} else if ( ! on && mirror ) {
				host.removeChild( mirror );
				mirror = mctx = null;
			}
		}
		setMirror();

		// data-fringe: chromatic aberration. Cyan and rose copies of each frame sit behind the ring,
		// offset either side by --fcl-fringe (in CSS), so colour shows only at its edges.
		var fringes = [];
		function setFringe() {
			var px = parseFloat( host.getAttribute( 'data-fringe' ) );
			var on = ! isNaN( px ) && px > 0;
			host.style.setProperty( '--fcl-fringe', ( on ? Math.min( px, 40 ) : 0 ) + 'px' );
			if ( on && ! fringes.length ) {
				[ 'cyan', 'rose' ].forEach( function ( name ) {
					var c = document.createElement( 'canvas' );
					c.className = 'fcl-torus__fringe fcl-torus__fringe--' + name;
					host.insertBefore( c, canvas );
					fringes.push( c );
				} );
			} else if ( ! on && fringes.length ) {
				fringes.forEach( function ( c ) {
					host.removeChild( c );
				} );
				fringes = [];
			}
		}
		setFringe();

		var R = 1, r = 0.11, mesh = null;
		var posBuf = gl.createBuffer(), norBuf = gl.createBuffer(), idxBuf = gl.createBuffer();
		function attribute( buf, attr ) {
			gl.bindBuffer( gl.ARRAY_BUFFER, buf );
			var loc = gl.getAttribLocation( prog, attr );
			gl.enableVertexAttribArray( loc );
			gl.vertexAttribPointer( loc, 3, gl.FLOAT, false, 0, 0 );
		}
		// (Re)build the tube whenever data-thickness changes.
		function setMesh() {
			var t = parseFloat( host.getAttribute( 'data-thickness' ) );
			t = isNaN( t ) ? 0.11 : Math.max( 0.03, Math.min( 0.45, t ) );
			if ( mesh && t === r ) {
				return;
			}
			r = t;
			mesh = torusMesh( R, r, 160, 56 );
			gl.bindBuffer( gl.ARRAY_BUFFER, posBuf );
			gl.bufferData( gl.ARRAY_BUFFER, mesh.pos, gl.STATIC_DRAW );
			attribute( posBuf, 'aPos' );
			gl.bindBuffer( gl.ARRAY_BUFFER, norBuf );
			gl.bufferData( gl.ARRAY_BUFFER, mesh.nor, gl.STATIC_DRAW );
			attribute( norBuf, 'aNor' );
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, idxBuf );
			gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW );
		}
		setMesh();
		gl.enable( gl.DEPTH_TEST );

		var u = {};
		[ 'uModel', 'uProj', 'uNormal', 'uLight', 'uMid', 'uDeep', 'uGlint', 'uGround', 'uCyan', 'uRose', 'uPrism', 'uReflect', 'uRough', 'uBright', 'uTurn', 'uBottom' ].forEach( function ( name ) {
			u[ name ] = gl.getUniformLocation( prog, name );
		} );

		function colours() {
			var cs = getComputedStyle( host );
			var v = function ( name, fb ) { return rgb( cs.getPropertyValue( '--' + name ), fb ); };
			var white = [ 1, 1, 1 ];
			var sky = v( 'sky', [ 0.58, 0.72, 0.88 ] ), ring = v( 'ring', [ 0.27, 0.41, 0.67 ] ), deep = v( 'ring-deep', [ 0.19, 0.31, 0.56 ] ), light = v( 'ring-light', [ 0.45, 0.59, 0.89 ] );
			// "cover" (default) matches the ring on the book cover; "sky" is a softer, lighter version.
			var custom = /^#[0-9a-f]{6}$/i.test( host.getAttribute( 'data-color' ) || '' ) ? rgb( host.getAttribute( 'data-color' ) ) : null;
			var tone = custom
				// A chosen colour: its lit side and shadow follow from it.
				? { l: mix( custom, white, 0.4 ), m: custom, d: mix( custom, [ 0, 0, 0 ], 0.38 ) }
				: host.getAttribute( 'data-tone' ) === 'sky'
					? { l: mix( sky, white, 0.55 ), m: sky, d: mix( sky, ring, 0.75 ) }
					: { l: light, m: mix( ring, deep, 0.3 ), d: mix( deep, [ 0, 0, 0 ], 0.18 ) };
			gl.uniform3fv( u.uLight, tone.l );
			gl.uniform3fv( u.uMid, tone.m );
			gl.uniform3fv( u.uDeep, tone.d );
			gl.uniform3fv( u.uGlint, mix( v( 'ring-glint', [ 0.73, 0.8, 0.93 ] ), white, 0.35 ) );
			gl.uniform3fv( u.uGround, v( 'mist-200', [ 0.85, 0.87, 0.93 ] ) );
			gl.uniform3fv( u.uCyan, v( 'prism-cyan', [ 0.5, 0.84, 0.92 ] ) );
			gl.uniform3fv( u.uRose, v( 'prism-rose', [ 0.78, 0.47, 0.68 ] ) );
			var prism = parseFloat( host.getAttribute( 'data-prism' ) );
			gl.uniform1f( u.uPrism, isNaN( prism ) ? 0.35 : prism );
			var reflect = parseFloat( host.getAttribute( 'data-reflect' ) );
			gl.uniform1f( u.uReflect, isNaN( reflect ) ? 1 : reflect );
			var rough = parseFloat( host.getAttribute( 'data-roughness' ) );
			gl.uniform1f( u.uRough, isNaN( rough ) ? 0.2 : Math.max( 0, Math.min( 1, rough ) ) );
			var bright = parseFloat( host.getAttribute( 'data-light' ) );
			gl.uniform1f( u.uBright, isNaN( bright ) ? 1 : Math.max( 0.2, Math.min( 2, bright ) ) );
			// Light angle in degrees, clockwise from the top; -30 is the cover's upper-left light.
			var angle = parseFloat( host.getAttribute( 'data-angle' ) );
			gl.uniform1f( u.uTurn, ( ( isNaN( angle ) ? -30 : angle ) + 30 ) * Math.PI / 180 );
			var bottom = parseFloat( host.getAttribute( 'data-bottom' ) );
			gl.uniform1f( u.uBottom, isNaN( bottom ) ? 0.3 : Math.max( 0, Math.min( 1, bottom ) ) );
		}

		var W = 0, H = 0;

		function resize() {
			var rect = host.getBoundingClientRect(), dpr = Math.min( window.devicePixelRatio || 1, 2 );
			W = Math.max( 1, Math.round( rect.width * dpr ) );
			H = Math.max( 1, Math.round( rect.height * dpr ) );
			canvas.width = W;
			canvas.height = H;
			gl.viewport( 0, 0, W, H );
			colours();
		}

		function draw() {
			var fov = Math.PI / 6;
			// Fit the ring's outer edge to about 89% of the element.
			var dist = ( R + r ) / ( Math.tan( fov / 2 ) * 0.89 );
			// Face on and unrotated: the ring lies flat to the screen.
			gl.uniformMatrix4fv( u.uModel, false, translate( -dist ) );
			gl.uniformMatrix4fv( u.uProj, false, perspective( fov, W / H, 0.1, 100 ) );
			gl.uniformMatrix3fv( u.uNormal, false, [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ] );
			gl.clearColor( 0, 0, 0, 0 );
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
			gl.drawElements( gl.TRIANGLES, mesh.idx.length, gl.UNSIGNED_SHORT, 0 );
			if ( mctx ) {
				if ( mirror.width !== W || mirror.height !== H ) {
					mirror.width = W;
					mirror.height = H;
				}
				mctx.clearRect( 0, 0, W, H );
				mctx.save();
				mctx.translate( 0, H );
				mctx.scale( 1, -1 );
				mctx.drawImage( canvas, 0, 0 );
				mctx.restore();
			}
			if ( fringes.length ) {
				var cs = getComputedStyle( host );
				fringes.forEach( function ( f, i ) {
					if ( f.width !== W || f.height !== H ) {
						f.width = W;
						f.height = H;
					}
					var ctx = f.getContext( '2d' );
					ctx.globalCompositeOperation = 'copy';
					ctx.drawImage( canvas, 0, 0 );
					// Keep the ring's silhouette, filled flat with the fringe colour.
					ctx.globalCompositeOperation = 'source-in';
					ctx.fillStyle = cs.getPropertyValue( i ? '--prism-rose' : '--prism-cyan' ).trim() || ( i ? '#c679ad' : '#80d5eb' );
					ctx.fillRect( 0, 0, W, H );
				} );
			}
		}

		resize();
		draw();
		host.classList.add( 'is-ready' );
		if ( host.parentNode ) {
			host.parentNode.classList.add( 'has-torus' );
		}

		if ( window.ResizeObserver ) {
			new ResizeObserver( function () {
				resize();
				draw();
			} ).observe( host );
		}
		// Settings can change after load (the torus lab's sliders, or a script): pick them up live.
		if ( window.MutationObserver ) {
			new MutationObserver( function () {
				setMesh();
				setMirror();
				setFringe();
				colours();
				draw();
			} ).observe( host, { attributes: true, attributeFilter: [ 'data-thickness', 'data-roughness', 'data-reflect', 'data-prism', 'data-tone', 'data-light', 'data-angle', 'data-bottom', 'data-color', 'data-mirror', 'data-fringe' ] } );
		}
		canvas.addEventListener( 'webglcontextlost', function ( e ) {
			e.preventDefault();
			host.classList.remove( 'is-ready' );
			if ( host.parentNode ) {
				host.parentNode.classList.remove( 'has-torus' );
			}
		} );
	}

	Array.prototype.forEach.call( hosts, init );
}() );
