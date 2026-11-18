/**
 * Tabs for the areas of practice.
 *
 * Turns each .fcl-tabs group into tabs: one button per .fcl-tab-panel, labelled with the
 * panel's letter and title, and only the chosen panel shown. Arrow keys, Home and End move
 * between tabs. A link to a panel's anchor (/our-practice/#founder-to-flourishing, as the
 * cards on the home page use) opens that tab, and choosing a tab updates the address so it
 * can be shared. Without this script every panel simply shows, one after another.
 *
 * @package full-circle-leadership
 */
( function () {
	var groups = document.querySelectorAll( '.fcl-tabs' );
	if ( ! groups.length ) {
		return;
	}
	var motion = window.matchMedia( '(prefers-reduced-motion: reduce)' );

	Array.prototype.forEach.call( groups, function ( group, g ) {
		var panels = Array.prototype.slice.call( group.querySelectorAll( ':scope > .fcl-tab-panel' ) );
		if ( panels.length < 2 ) {
			return;
		}
		var list = document.createElement( 'div' );
		list.className = 'fcl-tabs__list';
		list.setAttribute( 'role', 'tablist' );
		list.setAttribute( 'aria-orientation', 'horizontal' );
		var head = group.parentNode.querySelector( '.fcl-section-head .fcl-eyebrow' );
		if ( head ) {
			list.setAttribute( 'aria-label', head.textContent.trim() );
		}

		var tabs = panels.map( function ( panel, i ) {
			if ( ! panel.id ) {
				panel.id = 'fcl-tab-panel-' + g + '-' + i;
			}
			var letter = panel.querySelector( '.fcl-letter' );
			var title = panel.querySelector( '.fcl-tab-panel__title' );
			var tab = document.createElement( 'button' );
			tab.type = 'button';
			tab.className = 'fcl-tabs__tab';
			tab.id = panel.id + '-tab';
			tab.setAttribute( 'role', 'tab' );
			tab.setAttribute( 'aria-controls', panel.id );
			tab.innerHTML = '<span class="fcl-tabs__letter" aria-hidden="true"></span><span class="fcl-tabs__label"></span>';
			tab.firstChild.textContent = letter ? letter.textContent.trim() : String( i + 1 );
			tab.lastChild.textContent = title ? title.textContent.trim() : panel.id;
			panel.setAttribute( 'role', 'tabpanel' );
			panel.setAttribute( 'aria-labelledby', tab.id );
			panel.setAttribute( 'tabindex', '0' );
			list.appendChild( tab );
			return tab;
		} );
		group.insertBefore( list, group.firstChild );
		group.classList.add( 'is-tabbed' );

		function select( index, opts ) {
			opts = opts || {};
			tabs.forEach( function ( tab, i ) {
				var on = i === index;
				tab.setAttribute( 'aria-selected', String( on ) );
				tab.tabIndex = on ? 0 : -1;
				panels[ i ].hidden = ! on;
				if ( on && opts.animate && ! motion.matches ) {
					panels[ i ].classList.remove( 'is-entering' );
					void panels[ i ].offsetWidth; // Restart the entrance on each change.
					panels[ i ].classList.add( 'is-entering' );
				}
			} );
			if ( opts.focus ) {
				tabs[ index ].focus();
			}
			if ( opts.remember && window.history && history.replaceState ) {
				history.replaceState( null, '', '#' + panels[ index ].id );
			}
		}

		function current() {
			return tabs.findIndex( function ( tab ) {
				return tab.getAttribute( 'aria-selected' ) === 'true';
			} );
		}

		tabs.forEach( function ( tab, i ) {
			tab.addEventListener( 'click', function () {
				if ( i !== current() ) {
					select( i, { animate: true, remember: true } );
				}
			} );
		} );
		list.addEventListener( 'keydown', function ( e ) {
			var i = current(), n = tabs.length, next = null;
			if ( e.key === 'ArrowDown' || e.key === 'ArrowRight' ) {
				next = ( i + 1 ) % n;
			} else if ( e.key === 'ArrowUp' || e.key === 'ArrowLeft' ) {
				next = ( i - 1 + n ) % n;
			} else if ( e.key === 'Home' ) {
				next = 0;
			} else if ( e.key === 'End' ) {
				next = n - 1;
			}
			if ( next !== null ) {
				e.preventDefault();
				select( next, { animate: true, focus: true, remember: true } );
			}
		} );

		// Open the tab a link points at, and bring the tabs into view: the list and the panel
		// together, clear of the header (scroll-margin in CSS). The browser's own jump to the
		// anchor lands on the panel alone, so this runs after it.
		function fromHash() {
			var id = decodeURIComponent( window.location.hash.slice( 1 ) );
			var index = panels.findIndex( function ( panel ) {
				return panel.id === id;
			} );
			if ( index < 0 ) {
				return false;
			}
			select( index );
			return true;
		}
		function reveal() {
			requestAnimationFrame( function () {
				group.scrollIntoView( { block: 'start' } );
			} );
		}
		if ( fromHash() ) {
			if ( document.readyState === 'complete' ) {
				reveal();
			} else {
				window.addEventListener( 'load', reveal, { once: true } );
			}
		} else {
			select( 0 );
		}
		window.addEventListener( 'hashchange', function () {
			if ( fromHash() ) {
				reveal();
			}
		} );
	} );
}() );
