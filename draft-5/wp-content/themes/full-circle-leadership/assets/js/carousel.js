/**
 * Carousel for the endorsements on the book page.
 *
 * Each .fcl-carousel holds a scrolling track of slides that snap into place. This turns to
 * the next slide every few seconds and runs on endlessly: after the last slide the first
 * slides in from the right again, and before the first the last comes in from the left (a
 * copy of each sits at the far ends, and the track quietly jumps back to the real one once it
 * arrives). It adds previous and next arrows at the sides
 * (shown on hover or keyboard focus), and under it a full-width bar with one segment per
 * slide, the current one filling as its time runs out, and a pause button. It
 * keeps them in step as the track is swiped or scrolled and labels the parts for screen
 * readers.
 *
 * Rotation waits while the pointer is over the carousel or focus is inside it, while a dialog
 * is open (such as a full endorsement), while it is
 * off screen or the tab is hidden, and while its top is scrolled out of view (on phones a
 * slide is taller than the screen, so someone is reading it). It stops for good once the
 * track is touched, and never starts for people who ask for reduced motion. Without this
 * script the track still scrolls sideways and snaps slide by slide.
 *
 * @package full-circle-leadership
 */
( function () {
	var carousels = document.querySelectorAll( '.fcl-carousel' );
	if ( ! carousels.length ) {
		return;
	}
	var DELAY = 8000;
	var motion = window.matchMedia( '(prefers-reduced-motion: reduce)' );

	Array.prototype.forEach.call( carousels, function ( carousel ) {
		var track = carousel.querySelector( '.fcl-carousel__track' );
		var slides = track ? Array.prototype.slice.call( track.children ) : [];
		if ( slides.length < 2 ) {
			return;
		}
		var head = carousel.parentNode.querySelector( '.fcl-eyebrow' );
		carousel.setAttribute( 'role', 'region' );
		carousel.setAttribute( 'aria-roledescription', 'carousel' );
		carousel.setAttribute( 'aria-label', head ? head.textContent.trim() : 'Carousel' );
		slides.forEach( function ( slide, i ) {
			slide.setAttribute( 'role', 'group' );
			slide.setAttribute( 'aria-roledescription', 'slide' );
			slide.setAttribute( 'aria-label', ( i + 1 ) + ' of ' + slides.length );
		} );

		var button = function ( label, cls ) {
			var b = document.createElement( 'button' );
			b.type = 'button';
			b.className = cls;
			b.setAttribute( 'aria-label', label );
			return b;
		};
		var prev = button( 'Previous slide', 'fcl-carousel__step fcl-carousel__step--prev' );
		var next = button( 'Next slide', 'fcl-carousel__step fcl-carousel__step--next' );
		var pause = button( 'Pause rotation', 'fcl-carousel__pause' );
		var controls = document.createElement( 'div' );
		controls.className = 'fcl-carousel__controls';
		var markers = document.createElement( 'div' );
		markers.className = 'fcl-carousel__markers';
		var dots = slides.map( function ( slide, i ) {
			var d = button( 'Slide ' + ( i + 1 ), 'fcl-carousel__marker' );
			d.addEventListener( 'click', function () {
				go( i );
			} );
			markers.appendChild( d );
			return d;
		} );
		controls.appendChild( markers );
		controls.appendChild( pause );
		// The arrows sit either side of the slides, so wrap the track to centre them on it.
		var stage = document.createElement( 'div' );
		stage.className = 'fcl-carousel__stage';
		track.parentNode.insertBefore( stage, track );
		stage.appendChild( track );
		stage.appendChild( prev );
		stage.appendChild( next );
		carousel.appendChild( controls );
		carousel.classList.add( 'is-carousel' );
		carousel.style.setProperty( '--fcl-carousel-delay', DELAY + 'ms' );

		// Copies of the last and first slides at either end, hidden from screen readers and
		// keyboards. Track positions count these: real slide i sits at position i + 1.
		var copy = function ( slide ) {
			var c = slide.cloneNode( true );
			[ 'role', 'aria-roledescription', 'aria-label' ].forEach( function ( a ) {
				c.removeAttribute( a );
			} );
			c.setAttribute( 'aria-hidden', 'true' );
			c.inert = true;
			return c;
		};
		var n = slides.length;
		track.insertBefore( copy( slides[ n - 1 ] ), slides[ 0 ] );
		track.appendChild( copy( slides[ 0 ] ) );
		var all = Array.prototype.slice.call( track.children );
		// Where the track scrolls to show a position: the track has padding at its sides (its
		// faded edges), so a slide's resting point is its offset less that padding.
		var left = function ( pos ) {
			return all[ pos ].offsetLeft - parseFloat( getComputedStyle( track ).paddingLeft );
		};
		var at = function ( pos ) {
			track.scrollTo( { left: left( pos ), behavior: 'instant' } );
		};
		at( 1 );
		window.addEventListener( 'resize', function () {
			at( current + 1 );
		} );

		var current = 0;
		var target = null; // The track position a programmatic scroll is heading for.
		function go( i, auto ) {
			// Stepping past either end heads for the copy there; anything else for the real slide.
			var pos = i < 0 ? 0 : i >= n ? n + 1 : i + 1;
			i = ( i + n ) % n;
			var behavior = motion.matches ? 'instant' : 'smooth';
			// After a click on a phone, bring the top of the new slide back into view. The page
			// then jumps, so the slide changes at once too (Chrome drops a smooth slide started
			// straight after the page moves).
			var top = carousel.getBoundingClientRect().top;
			if ( ! auto && top < 0 ) {
				window.scrollBy( { top: top - 96, behavior: 'instant' } );
				behavior = 'instant';
			}
			if ( behavior === 'instant' ) {
				target = null;
				at( i + 1 );
			} else {
				target = pos;
				track.scrollTo( { left: left( pos ), behavior: 'smooth' } );
			}
			show( i );
		}
		function show( i ) {
			current = i;
			// Clear every marker first so the current one's fill starts again from empty, even
			// when it was already current.
			dots.forEach( function ( d ) {
				d.setAttribute( 'aria-current', 'false' );
			} );
			void markers.offsetWidth;
			dots[ i ].setAttribute( 'aria-current', 'true' );
			clearTimeout( timer );
			timer = 0;
			remaining = DELAY;
			schedule();
		}
		prev.addEventListener( 'click', function () {
			go( current - 1 );
		} );
		next.addEventListener( 'click', function () {
			go( current + 1 );
		} );
		carousel.addEventListener( 'keydown', function ( e ) {
			if ( e.target.closest( '.fcl-carousel__controls, .fcl-carousel__step' ) && ( e.key === 'ArrowLeft' || e.key === 'ArrowRight' ) ) {
				e.preventDefault();
				go( current + ( e.key === 'ArrowLeft' ? -1 : 1 ) );
			}
		} );

		// Follow swipes and trackpad scrolling: the slide nearest the left edge is current. While
		// a programmatic scroll is under way, wait until it arrives so the markers don't flicker
		// through the slides it passes. Once the track comes to rest on a copy, jump to the real
		// slide it copies; they look the same, so the jump doesn't show.
		var pending = 0;
		var resting = 0;
		var position = function () {
			return Math.max( 0, Math.min( n + 1, Math.round( track.scrollLeft / ( all[ 1 ].offsetLeft - all[ 0 ].offsetLeft ) ) ) );
		};
		track.addEventListener( 'scroll', function () {
			cancelAnimationFrame( pending );
			pending = requestAnimationFrame( function () {
				var pos = position();
				if ( target !== null ) {
					if ( pos === target && Math.abs( track.scrollLeft - left( pos ) ) < 2 ) {
						target = null;
					}
					return;
				}
				var i = ( pos - 1 + n ) % n;
				if ( i !== current ) {
					show( i );
				}
			} );
			clearTimeout( resting );
			resting = setTimeout( function () {
				var pos = position();
				if ( ( pos === 0 || pos === n + 1 ) && Math.abs( track.scrollLeft - left( pos ) ) < 2 ) {
					target = null;
					at( pos === 0 ? n : 1 );
				}
			}, 150 );
		} );

		// Rotation. The current marker fills as the time to the next slide runs out; when
		// rotation waits, the fill and the time left both hold where they are.
		var timer = 0;
		var remaining = DELAY;
		var startedAt = 0;
		var below = false; // The carousel's top is scrolled out of view.
		var paused = false; // By the pause button.
		var stopped = false; // By touching the track.
		var hovered = false;
		var focused = false;
		var onScreen = false;
		function canPlay() {
			return ! motion.matches && ! paused && ! stopped && ! hovered && ! focused && ! below && onScreen && ! document.hidden && ! document.querySelector( 'dialog[open]' );
		}
		function schedule() {
			if ( timer ) {
				clearTimeout( timer );
				timer = 0;
				remaining = Math.max( 0, remaining - ( Date.now() - startedAt ) );
			}
			var playing = canPlay();
			carousel.classList.toggle( 'is-playing', playing );
			carousel.classList.toggle( 'is-static', motion.matches || stopped );
			track.setAttribute( 'aria-live', playing ? 'off' : 'polite' );
			if ( playing ) {
				startedAt = Date.now();
				timer = setTimeout( function () {
					timer = 0;
					go( current + 1, true );
				}, remaining );
			}
		}
		// On phones a slide is taller than the screen: once its top scrolls away, someone is
		// reading further down it, so wait.
		var looking = 0;
		window.addEventListener(
			'scroll',
			function () {
				cancelAnimationFrame( looking );
				looking = requestAnimationFrame( function () {
					var now = carousel.getBoundingClientRect().top < -40;
					if ( now !== below ) {
						below = now;
						schedule();
					}
				} );
			},
			{ passive: true }
		);
		pause.addEventListener( 'click', function () {
			paused = ! paused;
			pause.classList.toggle( 'is-paused', paused );
			pause.setAttribute( 'aria-label', paused ? 'Play rotation' : 'Pause rotation' );
			schedule();
		} );
		carousel.addEventListener( 'mouseenter', function () {
			hovered = true;
			schedule();
		} );
		carousel.addEventListener( 'mouseleave', function () {
			hovered = false;
			schedule();
		} );
		carousel.addEventListener( 'focusin', function () {
			focused = true;
			schedule();
		} );
		carousel.addEventListener( 'focusout', function ( e ) {
			if ( ! carousel.contains( e.relatedTarget ) ) {
				focused = false;
				schedule();
			}
		} );
		track.addEventListener(
			'touchstart',
			function () {
				stopped = true;
				schedule();
			},
			{ passive: true }
		);
		document.addEventListener( 'visibilitychange', schedule );
		document.addEventListener( 'fcl-dialog', schedule );
		if ( motion.addEventListener ) {
			motion.addEventListener( 'change', schedule );
		}
		if ( 'IntersectionObserver' in window ) {
			new IntersectionObserver(
				function ( entries ) {
					onScreen = entries[ 0 ].isIntersecting;
					schedule();
				},
				{ threshold: 0.4 }
			).observe( track );
		} else {
			onScreen = true;
		}
		if ( motion.matches ) {
			pause.hidden = true;
		}
		show( 0 );
	} );
}() );
