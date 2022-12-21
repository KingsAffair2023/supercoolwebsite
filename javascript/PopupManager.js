

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




	/** @private {GridManager} */
	_gridManager;



	/** @private {Object} */
	_canvas;

	/** @private {Object} */
	_popup;


	/** @private {String} */
	_currentState;

	/** @private {String} */
	_nextState;

	/** @private {HTMLElement} The next contents to show on the popup */
	_nextContents = null;

	/** @private {Boolean} */
	_animationBusy = false;



	/**
	 * @param {Object} canvas A D3 selection for the fixed outer element of the popup.
	 * @param {Object} popup A D3 selection for the inner element of the popup, to which different contents are appended.
	 * @param {GridManager} gridManager
	 */
	constructor ( canvas, popup, gridManager )
	{
		/* Save the parameters */
		this._canvas = canvas;
		this._popup = popup;
		this._gridManager = gridManager;

		/* Set the state to closed */
		this._currentState = this._nextState = PopupManager.states.CLOSED;
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
			this._canvas
				.style ( "transition", "bottom" )
				.style ( "transition-duration", PopupManager.animationDuration + "ms" )
				.style ( "bottom", this._nextState === PopupManager.states.OPEN ? "0vh" : "-100vh" );

			/* Hide or show the cards */
			if ( this._nextState === PopupManager.states.CLOSED )
				this._gridManager.showCards ();
			else
				this._gridManager.hideCards ();

			/* Enable/disable scrolling */
			document.scrollingElement.style.overflowY = ( this._nextState === PopupManager.states.CLOSED ? "auto" : "hidden" );

			/* Scroll to the top */
			this._canvas.node ().scrollTo ( 0, 0 );

			/* Blur the canvas */
			this._gridManager._canvas
				.style ( "transition", "filter" )
				.style ( "transition-duration", PopupManager.animationDuration + "ms" )
				.style ( "filter", "blur(" + ( this._nextState === PopupManager.states.CLOSED ? 0 : PopupManager.backgroundBlur ) + "px)" );

			/* Notify that an animation is occurring, and transition after completing the animation */
			this._animationBusy = true;
			setTimeout ( () =>
			{
				this._animationBusy = false;
				this._transitionPopup ();
			}, PopupManager.animationDuration );

			/* Set the state */
			this._currentState = this._nextState;
		}
	}





}