/**
 * Full endorsements in a dialog.
 *
 * Each endorsement card carries its whole text in a "Read more" disclosure. This hides the
 * disclosure, puts a small "Read more" at the end of the highlight instead, and makes the
 * whole card a way in: either opens the full text, with the endorser's name and role, in a
 * dialog, so a carousel slide keeps its size. The carousel waits while the dialog is open (it
 * listens for the "fcl-dialog" event). Without this script the disclosure unfolds in place.
 *
 * @package full-circle-leadership
 */
( function () {
	var cards = document.querySelectorAll( '.fcl-endorse' );
	if ( ! cards.length || ! window.HTMLDialogElement ) {
		return;
	}

	var dialog = document.createElement( 'dialog' );
	dialog.className = 'fcl-endorse-dialog';
	dialog.setAttribute( 'aria-labelledby', 'fcl-endorse-dialog-name' );
	var body = document.createElement( 'div' );
	body.className = 'fcl-endorse-dialog__body';
	var close = document.createElement( 'button' );
	close.type = 'button';
	close.className = 'fcl-endorse-dialog__close';
	close.setAttribute( 'aria-label', 'Close' );
	dialog.appendChild( close );
	dialog.appendChild( body );
	document.body.appendChild( dialog );

	var announce = function () {
		document.dispatchEvent( new Event( 'fcl-dialog' ) );
	};
	close.addEventListener( 'click', function () {
		dialog.close();
	} );
	// A click on the backdrop (outside the panel) closes it too.
	dialog.addEventListener( 'click', function ( e ) {
		if ( e.target === dialog ) {
			dialog.close();
		}
	} );
	dialog.addEventListener( 'close', announce );

	function open( card ) {
		var quote = document.createElement( 'blockquote' );
		quote.className = 'fcl-endorse__quote';
		quote.innerHTML = card.querySelector( '.fcl-endorse__full' ).innerHTML;
		var by = card.querySelector( '.fcl-endorse__by' ).cloneNode( true );
		by.querySelector( 'strong' ).id = 'fcl-endorse-dialog-name';
		body.textContent = '';
		body.appendChild( quote );
		body.appendChild( by );
		dialog.showModal();
		body.scrollTop = 0;
		announce();
	}

	Array.prototype.forEach.call( cards, function ( card ) {
		var line = card.querySelector( '.fcl-endorse__quote p' );
		if ( ! line || ! card.querySelector( '.fcl-endorse__full' ) ) {
			return;
		}
		var read = document.createElement( 'button' );
		read.type = 'button';
		read.className = 'fcl-endorse__read';
		read.textContent = 'Read more';
		read.setAttribute( 'aria-haspopup', 'dialog' );
		read.setAttribute( 'aria-label', 'Read the full endorsement from ' + card.querySelector( '.fcl-endorse__by strong' ).textContent );
		line.appendChild( read );
		card.classList.add( 'is-enhanced' );
		card.addEventListener( 'click', function ( e ) {
			if ( ! e.target.closest( 'a' ) ) {
				open( card );
			}
		} );
	} );
}() );
