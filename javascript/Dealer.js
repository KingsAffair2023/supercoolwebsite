


class Line
{
	/** @public {Vec} */
	p1;

	/** @public {Vec} */
	p2;

	/** @public {Vec} */
	domMin;

	/** @public {Vec} */
	domMax;

	/** @public {Number} */
	a;

	/** @public {Number} */
	b;

	/** @public {Number} */
	c;

	/** @public {Number} */
	static epsilon = 0.001;




	/**
	 * @description Construct a line of the form mx + ny = 1, between points p1 and p2.
	 * @param {Vec} p1
	 * @param {Vec} p2
	 */
	constructor ( p1, p2 )
	{
		this._reset ( p1, p2 );
	}



	/**
	 * @param {Vec} p1
	 * @param {Vec} p2
	 * @private
	 */
	_reset ( p1, p2 )
	{
		this.p1 = p1;
		this.p2 = p2;
		this.a = ( p1.y - p2.y );
		this.b = ( p2.x - p1.x );
		this.c = p1.x * p2.y - p2.x * p1.y;
		this.domMin = new Vec ( Math.min ( p1.x, p2.x ), Math.min ( p1.y, p2.y ) );
		this.domMax = new Vec ( Math.max ( p1.x, p2.x ), Math.max ( p1.y, p2.y ) );
	}



	/**
	 * @param {Vec} center
	 * @param {Number} angle In radians
	 */
	rotate ( center, angle )
	{
		this._reset (
			this.p1.sub ( center ).rotate ( angle ).add ( center ),
			this.p2.sub ( center ).rotate ( angle ).add ( center ) );
	}



	/**
	 * @param {Vec} amount
	 */
	translate ( amount )
	{
		this._reset (
			this.p1.add ( amount ),
			this.p2.add ( amount ) );
	}



	/**
	 * @param {Line} other
	 * @returns {Vec[]}
	 */
	intercepts ( other )
	{
		/* Get a potential x intercept */
		const x = ( this.b * other.c - other.b * this.c ) / ( this.a * other.b - this.b * other.a );
		const y = ( this.a * other.c - other.a * this.c ) / ( this.b * other.a - this.a * other.b );

		/* Check the domain */
		if ( isFinite ( x ) && isFinite ( y ) )
			if ( x > this.domMin.x - Line.epsilon && x < this.domMax.x + Line.epsilon && x > other.domMin.x - Line.epsilon && x < other.domMax.x + Line.epsilon )
				if ( y > this.domMin.y - Line.epsilon && y < this.domMax.y + Line.epsilon && y > other.domMin.y - Line.epsilon && y < other.domMax.y + Line.epsilon )
					return [ new Vec ( x, y ) ];
		return [];
	}



	/**
	 * @description Apply ax + by + 1 to the point (x, y)
	 * @param {Vec} point
	 * @returns {number}
	 */
	implicit ( point )
	{
		return this.a * point.x + this.b * point.y + this.c;
	}
}


class Rect
{

	/** @public {Line[]} Boarders of the rectangle: [top, bottom, left, right] */
	boarders;

	/** @public {Vec} The center of the rectangle */
	center;

	/** @public {Vec} The dimensions of the rectangle */
	size;



	/**
	 * @param {Vec} center
	 * @param {Vec} size
	 */
	constructor ( center, size )
	{
		this.center = center;
		this.size = size;

		const radius = size.div ( 2 );
		this.boarders = [
			new Line ( center.add ( new Vec ( -radius.x, -radius.y ) ), center.add ( new Vec (  radius.x, -radius.y ) ) ),
			new Line ( center.add ( new Vec ( -radius.x,  radius.y ) ), center.add ( new Vec (  radius.x,  radius.y ) ) ),
			new Line ( center.add ( new Vec ( -radius.x,  radius.y ) ), center.add ( new Vec ( -radius.x, -radius.y ) ) ),
			new Line ( center.add ( new Vec (  radius.x,  radius.y ) ), center.add ( new Vec (  radius.x, -radius.y ) ) ),
		];
	}



	/**
	 * @returns {Vec[]}
	 */
	corners ()
	{
		return [
			this.boarders [ 0 ].p1, this.boarders [ 0 ].p2,
			this.boarders [ 1 ].p1, this.boarders [ 1 ].p2 ];
	}



	/**
	 * @param {Vec} amount
	 * @returns {Rect} This rectangle
	 */
	translate ( amount )
	{
		this.center = this.center.add ( amount );
		for ( const boarder of this.boarders )
			boarder.translate ( amount );
		return this;
	}



	/**
	 * @param {Number} angle In radians
	 * @returns {Rect} This rectangle
	 */
	rotate ( angle )
	{
		for ( const boarder of this.boarders )
			boarder.rotate ( this.center, angle );
		return this;
	}



	/**
	 * @param {Vec} point
	 * @returns {boolean}
	 */
	containsPoint ( point )
	{
		return ( this.boarders [ 0 ].implicit ( point ) * this.boarders [ 1 ].implicit ( point ) ) <= 0 &&
			( this.boarders [ 2 ].implicit ( point ) * this.boarders [ 3 ].implicit ( point ) ) <= 0
	}



	/**
	 * @param {Rect} rect
	 * @returns {boolean}
	 */
	overlaps ( rect )
	{
		return this.containsPoint ( rect.boarders [ 0 ].p1 ) || this.containsPoint ( rect.boarders [ 0 ].p2 ) ||
			this.containsPoint ( rect.boarders [ 1 ].p1 ) || this.containsPoint ( rect.boarders [ 1 ].p2 ) ||
			rect.containsPoint ( this.boarders [ 0 ].p1 ) || rect.containsPoint ( this.boarders [ 0 ].p2 ) ||
			rect.containsPoint ( this.boarders [ 1 ].p1 ) || rect.containsPoint ( this.boarders [ 1 ].p2 );
	}



	/**
	 * @param {Rect} rect
	 */
	allIntercepts ( rect )
	{
		let intercepts = [];
		for ( const b1 of this.boarders )
			for ( const b2 of rect.boarders )
				intercepts = intercepts.concat ( b1.intercepts ( b2 ) );
		return intercepts;
	}

}



class Dealer
{

	/** @private {Object} A D3 selection of cards */
	_cards;

	/** @private {Vec} The dimensions of the cards */
	_cardSize;

	/** @private {Vec} The deal area position */
	_dealPos;

	/** @private {Vec} The deal area size */
	_dealSize;

	/** @private {Vec} The position from which cards are dealt */
	_dealOrigin;



	/** @public {Vec} As a multiple of the card average side length */
	static transJitter = 0.2;

	/** @public {Number} */
	static rotJitter = 10;

	/** @public {Number} */
	static jitterIter = 10;



	/**
	 * @param {Object} cards A D3 selection of cards
	 * @param {Vec} cardSize The dimensions of the cards
	 * @param {Vec} dealPos The deal area position
	 * @param {Vec} dealSize The deal area size
	 * @param {Vec} dealOrigin The position from which cards are dealt
	 */
	constructor (
		cards,
		cardSize,
		dealPos,
		dealSize,
		dealOrigin
	)
	{
		this._cards = cards;
		this._cardSize = cardSize;
		this._dealPos = dealPos;
		this._dealSize = dealSize;
		this._dealOrigin = dealOrigin;
	}



	/**
	 * @description Create the animation to deal the cards.
	 * @public
	 */
	createAnimation ()
	{
		/* Get the minimum grid of cards required to cover the deal area */
		const minGrid = new Vec ( Math.ceil ( this._dealSize.x / this._cardSize.x ), Math.ceil ( this._dealSize.y / this._cardSize.y ) );

		/* Throw if we cannot cover the deal area */
		if ( minGrid.x * minGrid.y > this._cards.size () )
			throw new Error ( "Dealer.createAnimation: Could not cover the dealer area with the cards provided" );

		/* The card margin when positioning. Consider solving for margin in:
		 * minGrid ( cardSize - margin ) - margin = dealSize
		 */
		const margin = minGrid.mult ( this._cardSize ).sub ( this._dealSize ).div ( minGrid.add ( new Vec ( 1 ) ) );

		/* Initially distribute some cards.
		 * Choose random orientation of 0 or 180 degrees.
		 */
		const endParams = new Array ( this._cards.size () );
		for ( let i = 0; i < minGrid.x; ++i )
			for ( let j = 0; j < minGrid.y; ++j )
				endParams [ minGrid.y * i + j ] = new AnimParams (
					this._dealPos.sub ( margin ).add ( this._cardSize.sub ( margin ).mult ( new Vec ( i, j ) ) ),
					this._cardSize,
					0 )

		/* Completely randomly distribute the remaining cards */
		for ( let i = minGrid.x * minGrid.y; i < this._cards.size (); ++i )
			endParams [ i ] = new AnimParams (
				this._dealPos.add ( this._dealSize.sub ( this._cardSize ).mult ( Math.random () ) ),
				this._cardSize,
				0 );

		/* Generate noise */
		this.generateNoise ( endParams );

		/* Permute the end parameters */
		for ( let i = minGrid.x * minGrid.y - 1; i > 0; i-- )
		{
			const j = Math.floor ( Math.random () * ( i + 1 ) );
			[ endParams [ i ], endParams [ j ] ] = [ endParams [ j ] , endParams [ i ] ];
		}

		/* Construct the initial position parameters */
		const startParams = new Array ( this._cards.size () );
		for ( let i = 0; i < this._cards.size (); ++i )
			startParams [ i ] = new AnimParams ( this._dealOrigin, this._cardSize, 0 );

		/* Create animations for each card */
		const animations = new Array ( this._cards.size () );

		/* Return the animation */
		this._cards.each ( function ( d, i ) {
			const card = d3.select ( this );
			animations [ i ] = new Anim (
				card,
				startParams [ i ],
				null,
				d3.easeSinOut,
				i * 150
			).continueTo (
				endParams [ i ],
				d3.easeSinOut,
				1000
			);
		} );

		/* Return a final animation */
		return Anim.Delay ( this._cards, d3.easeSinOut, 0, animations );
	}


	/**
	 * @param {AnimParams[]} endParams
	 */
	generateNoise ( endParams )
	{

		/* Create a rectangle for the deal area */
		const dealRect = new Rect ( this._dealPos.add ( this._dealSize.div ( 2 ) ), this._dealSize );

		/* Create rectangles for the cards */
		const cardRects = endParams.map ( param =>
			new Rect ( param.position.add ( this._cardSize.div ( 2 ) ), this._cardSize ) );

		/* Iterate over victim rectangles */
		for ( let its = 0; its < Dealer.jitterIter; ++its )
			for ( let victim_i = 0; victim_i < cardRects.length; ++victim_i )
			{
				/* Get the victim */
				const victim = cardRects [ victim_i ];

				/* Create the jitter amounts */
				const trans = new Vec ( Math.random (), Math.random () ).mult ( 2 ).sub ( new Vec ( 1 ) )
					.mult ( this._cardSize.x + this._cardSize.y * 0.5 * Dealer.transJitter )
					.clamp ( this._dealPos.sub ( victim.center ), this._dealPos.add ( this._dealSize ).sub ( victim.center ) );
				const rot = ( Math.random () * 2 - 1 ) * Dealer.rotJitter;

				victim.translate ( trans );
				victim.rotate ( Vec.rad ( rot ) );

				/* Get an object of query points, and the rectangles that they came from */
				let queryPoints = [ { points : dealRect.corners (), rects : [] } ];
				for ( let i = 0; i < cardRects.length; ++i )
				{
					/* Add the corners of this rectangle, and all intercepts with the deal area */
					queryPoints.push ( {
						points : [ ...cardRects [ i ].corners (), ...cardRects [ i ].allIntercepts ( dealRect ) ],
						rects : [ cardRects [ i ] ] } );

					/* Add intercepts with other rectangles */
					for ( let j = i + 1; j < cardRects.length; ++j )
						queryPoints.push ( {
							points : cardRects [ i ].allIntercepts ( cardRects [ j ] ),
							rects : [ cardRects [ i ], cardRects [ j ] ] } );
				}

				/* Check for bad points */
				let badNoise = false;
				for ( const queryPoint of queryPoints )
				{
					for ( const point of queryPoint.points )
					{
						/* This point is fine if it is outside  the deal area */
						if ( !dealRect.containsPoint ( point ) )
							continue;

						/* Test whether the point is covered */
						let covered = false;
						for ( let i = 0; i < cardRects.length && !covered; ++i )
							covered = !queryPoint.rects.includes ( cardRects [ i ] ) && cardRects [ i ].containsPoint ( point );

						/* Break if the point was not covered */
						if ( ( badNoise = !covered ) )
							break;
					}
					if ( badNoise ) break;
				}

				/* Undo the movement, if it was bad. Otherwise commit it. */
				if ( badNoise )
					victim.rotate ( -Vec.rad ( rot ) ).translate ( trans.neg () );
				else
					endParams [ victim_i ] = new AnimParams (
						endParams [ victim_i ].position.add ( trans ),
						endParams [ victim_i ].size,
						endParams [ victim_i ].rotation + rot );
			}
	}

}