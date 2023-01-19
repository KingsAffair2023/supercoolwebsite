

class PopupManager
{

	/**
	 * @public {Readonly<{CLOSED: string, OPEN: string}>}
	 */
	static states = Object.freeze ( {
		CLOSED : "CLOSED",
		OPEN : "OPEN"
	} );

	/** @public {Number} */
	static animationDuration = 500;

	/** @public {Number} */
	static backgroundBlur = 4;

	/** @public {Number} */
	static overscrollCloseAmount = 100;



	/** @private {GridManager} */
	_gridManager;

	/** @private {OverscrollDetector} */
	_overscrollDetector;



	/** @private {Object} */
	_canvas;

	/** @private {Object} */
	_popup;

	/** @private {Object} */
	_popupClose;


	/** @private {String} */
	_currentState;

	/** @private {String} */
	_nextState;

	/** @private {HTMLElement} The next contents to show on the popup */
	_nextContents = null;

	/** @private {Boolean} */
	_animationBusy = false;

	/** @private {HTMLElement} */
	_focusBeforeOpening = null;



	/**
	 * @param {Object} canvas A D3 selection for the fixed outer element of the popup.
	 * @param {Object} popup A D3 selection for the inner element of the popup, to which different contents are appended.
	 * @param {Object} popupClose A D3 selection for the close button of the popup.
	 * @param {GridManager} gridManager
	 */
	constructor ( canvas, popup, popupClose, gridManager )
	{
		/* Save the parameters */
		this._canvas = canvas;
		this._popup = popup;
		this._popupClose = popupClose;
		this._gridManager = gridManager;

		/* Set the state to closed */
		this._currentState = this._nextState = PopupManager.states.CLOSED;

		/* Create the overscroll detector, only if we are on mobile */
		if ( GridManager.mobile )
			this._overscrollDetector = new OverscrollDetector (
				this._canvas,
				overscroll =>
				{
					if ( this._currentState === PopupManager.states.OPEN && overscroll.y < 0 )
						this.closePopup ();
				},
				new Vec ( Infinity, PopupManager.overscrollCloseAmount ) );

		/* Set the handler for the close button */
		this._popupClose.on ( "click", () => this.closePopup () );

		/* Close if escape is pressed */
		window.addEventListener ( "keyup", e =>
		{
			if ( e.key === "Escape" )
				this.closePopup ();
		} );
	}

	/**
	 * @param {HTMLElement} contents
	 */
	openPopup ( contents )
	{
		/* Set the next state */
		this._nextContents = contents;
		this._nextState = PopupManager.states.OPEN;

		/* Transition */
		this._transitionPopup ();
	}

	/**
	 */
	closePopup ()
	{
		/* Set the next state */
		this._nextState = PopupManager.states.CLOSED;

		/* Transition */
		this._transitionPopup ();
	}



	/**
	 * @description Transition to the next popup state.
	 * @private
	 */
	_transitionPopup ()
	{
		/* Don't transition of we are busy animating */
		if ( this._animationBusy )
			return;

		/* Set new contents */
		if ( this._nextContents )
		{
			/* Clear the old contents */
			while ( this._popup.node ().firstChild )
				this._popup.node ().removeChild ( this._popup.node ().lastChild );

			/* Add the contents */
			this._popup.node ().appendChild ( this._nextContents );

			/* Set there to be no next contents */
			this._nextContents = null;
		}

		/* Animate */
		if ( this._nextState !== this._currentState )
		{
			/* Actually animate */
			setTimeout ( () => this._canvas
				.style ( "visibility", "visible" )
				.style ( "transition", "top" )
				.style ( "transition-duration", PopupManager.animationDuration + "ms" )
				.style ( "top", this._nextState === PopupManager.states.OPEN ? "0" : "100%" ) )

			/* Actually animate */
			setTimeout ( () => this._popupClose
				.style ( "transition", "transform" )
				.style ( "transition-duration", PopupManager.animationDuration + "ms" )
				.style ( "transition-delay", ( this._nextState === PopupManager.states.OPEN ? ( PopupManager.animationDuration / 2 ) : 0 ) + "ms" )
				.style ( "transform", this._nextState === PopupManager.states.OPEN ? "translate(0,-100%)" : "translate(0,0)" ) )

			/* Various operations depending on whether we are opening or closing */
			if ( this._nextState === PopupManager.states.CLOSED )
			{
				/* Show the cards */
				this._gridManager.showCards ();
				/* Disable scrolling on the popup canvas and make it inert */
				this._canvas.style ( "overflow", "hidden" )
					.property ( "inert", true );
				/* Make the grid canvas non-inert */
				this._gridManager._canvas.property ( "inert", false );
				/* Restore the focus */
				setTimeout ( () => this._focusBeforeOpening?.focus () );
			}
			else
			{
				/* Save the current focus */
				this._focusBeforeOpening = document.activeElement;
				/* Hide the cards */
				this._gridManager.hideCards ();
				/* Disable scrolling on the card canvas */
				document.scrollingElement.style.overflowY = "hidden";
				/* Make the canvas non-inert */
				this._canvas.property ( "inert", false );
				/* Make the  grid canvas inert */
				this._gridManager._canvas.property ( "inert", true );
				/* Set the close button to be focused */
				setTimeout ( () => this._popupClose.node ().focus () );
			}

			/* Scroll to the top */
			if ( this._canvas.node ().scrollTop > 0 )
				this._canvas.node ().scrollTo ( 0, 0 );

			/* Blur the canvas */
			setTimeout ( () => this._gridManager._canvas
				.style ( "transition", "filter" )
				.style ( "transition-duration", PopupManager.animationDuration + "ms" )
				.style ( "filter", "blur(" + ( this._nextState === PopupManager.states.CLOSED ? 0 : PopupManager.backgroundBlur ) + "px)" ) );

			/* Notify that an animation is occurring */
			this._animationBusy = true;

			/* Set the state */
			this._currentState = this._nextState;

			/* Set a timeout for the end of the animation */
			setTimeout ( () =>
			{
				/* Possibly hide the popup/enable scrolling */
				if ( this._currentState === PopupManager.states.CLOSED )
				{
					this._canvas.style ( "visibility", "hidden" );
					document.scrollingElement.style.overflowY = "auto";
				} else
				{
					this._canvas.style ( "overflow", "auto" );
				}

				/* Check we do not need to transition again */
				this._animationBusy = false;
				this._transitionPopup ();
			}, PopupManager.animationDuration );
		}
	}





}