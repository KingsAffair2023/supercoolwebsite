


class OverscrollDetector
{
	/** @public {Object} */
	target;

	/** @private {Function<Vec>:void} */
	_callback;

	/** @private {Vec} */
	_threshold;



	/** @private {Vec} */
	_touchStart;

	/** @private {Vec} */
	_scrollStart;



	/**
	 * @param {Object} target A D3 selection for the target of the drag event.
	 * @param {function(Vec):void} callback The callback for overscroll.
	 * @param {Vec} [threshold] The threshold for what is to be considered overscroll.
	 */
	constructor ( target, callback, threshold= new Vec ( 0 ) )
	{
		/* Save the parameters */
		this.target = target;
		this._callback = callback;
		this._threshold = threshold;

		/* Set callback for touchstart */
		this.target.on ( "touchstart", e => this._resetPositions ( e ) );

		/* Set the callback for touchmove */
		this.target.on ( "touchmove", e => this._detectOverscroll ( e ) );
	}

	/**
	 * @description Reset the starting touch and scroll positions.
	 * @param {TouchEvent} e
	 * @private
	 */
	_resetPositions ( e )
	{
		/* Set the touch position */
		this._touchStart = new Vec (
			e.touches [ 0 ].clientX,
			e.touches [ 0 ].clientY );

		/* Set the scroll position */
		this._scrollStart = new Vec (
			this.target.property ( "scrollLeft" ),
			this.target.property ( "scrollTop" ) );
	}

	/**
	 * @description Detect over-scrolling.
	 * @param {TouchEvent} e
	 * @private
	 */
	_detectOverscroll ( e )
	{
		/* Get the new touch position */
		const touchNew = new Vec (
			e.touches [ 0 ].clientX,
			e.touches [ 0 ].clientY	);

		/* Get the new scroll position */
		const scrollNew = new Vec (
			this.target.property ( "scrollLeft" ),
			this.target.property ( "scrollTop" ) );

		/* Get the fraction scrolled */
		const scrollFrac = scrollNew.div ( new Vec (
			( this.target.property ( "scrollWidth"  ) ) - ( this.target.property ( "clientWidth"  ) ) || 1,
			( this.target.property ( "scrollHeight" ) ) - ( this.target.property ( "clientHeight" ) ) || 1 ) );

		/* If either scroll direction is not at an extreme, then we cannot be over-scrolling in that direction */
		this._touchStart = new Vec (
			scrollFrac.x <= 0 || scrollFrac.x >= 1 ? this._touchStart.x : touchNew.x,
			scrollFrac.y <= 0 || scrollFrac.y >= 1 ? this._touchStart.y : touchNew.y );
		this._scrollStart = new Vec (
			scrollFrac.x <= 0 || scrollFrac.x >= 1 ? this._scrollStart.x : scrollNew.x,
			scrollFrac.y <= 0 || scrollFrac.y >= 1 ? this._scrollStart.y : scrollNew.y );

		/* Calculate the overscroll */
		const overscroll = scrollNew.sub ( this._scrollStart ).add ( touchNew.sub ( this._touchStart ) ).neg ();

		/* Compare the overscroll to the threshold */
		const clampedOverscroll = new Vec (
			Math.abs ( overscroll.x ) > this._threshold.x ? overscroll.x : 0,
			Math.abs ( overscroll.y ) > this._threshold.y ? overscroll.y : 0 );

		/* Run the callback */
		if ( !clampedOverscroll.equals ( new Vec () ) )
			this._callback ( overscroll );
	}
}