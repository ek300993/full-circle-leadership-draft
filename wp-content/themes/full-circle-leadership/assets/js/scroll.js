/**
 * Scroll effects.
 *
 * - The home hero's book lifts a little and the ring behind it opens out and fades as
 *   the hero scrolls away (sets --p from 0 to 1).
 * - The header firms up (a hairline and a frosted ground) once the page has scrolled.
 * - Sections rise in as they arrive; cards, quotes and columns follow one after another,
 *   and the reflection dividers draw out.
 *
 * Nothing moves under reduced motion, and without this script everything simply shows.
 *
 * @package full-circle-leadership
 */
( function () {
	var root = document.documentElement;
	var motion = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	var hero = document.querySelector( '.fcl-book-hero' );
	var ticking = false;

	function clamp( v ) {
		return Math.max( 0, Math.min( 1, v ) );
	}

	function onScroll() {
		ticking = false;
		root.classList.toggle( 'is-scrolled', window.scrollY > 8 );
		if ( hero && ! motion.matches ) {
			// From resting at the top of the page to the hero's bottom edge reaching the top of the screen.
			var rect = hero.getBoundingClientRect();
			hero.style.setProperty( '--p', clamp( -rect.top / rect.height ).toFixed( 3 ) );
		}
	}

	function requestTick() {
		if ( ! ticking ) {
			ticking = true;
			requestAnimationFrame( onScroll );
		}
	}

	window.addEventListener( 'scroll', requestTick, { passive: true } );
	window.addEventListener( 'resize', requestTick );
	onScroll();

	if ( motion.matches || ! window.IntersectionObserver ) {
		return;
	}
	root.classList.add( 'fcl-motion' );

	// Groups whose children arrive one after another, rather than all at once.
	var groups = '.fcl-grid, .fcl-quotes, .fcl-lenses, .fcl-essays, .fcl-thread, .fcl-situations, .fcl-steps';
	var targets = [];
	document.querySelectorAll( '.fcl-main .fcl-band > *' ).forEach( function ( el ) {
		if ( el.matches( groups ) ) {
			Array.prototype.forEach.call( el.children, function ( child, i ) {
				child.style.setProperty( '--i', Math.min( i, 6 ) );
				targets.push( child );
			} );
		} else {
			targets.push( el );
		}
	} );
	document.querySelectorAll( '.fcl-rule' ).forEach( function ( el ) {
		targets.push( el );
	} );

	var observer = new IntersectionObserver( function ( entries ) {
		entries.forEach( function ( entry ) {
			if ( entry.isIntersecting ) {
				entry.target.classList.add( 'is-in' );
				observer.unobserve( entry.target );
			}
		} );
	}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 } );

	targets.forEach( function ( el ) {
		if ( ! el.classList.contains( 'fcl-rule' ) ) {
			el.classList.add( 'fcl-reveal' );
		}
		observer.observe( el );
	} );
}() );
