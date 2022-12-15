/**
 * @class Line
 *
 * @description Creates an implicit representation of a line between two points.
 */
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
	 * @returns {Vec|null}
	 */
	intercept ( other )
	{
		/* Get a potential x intercept */
		const x = ( this.b * other.c - other.b * this.c ) / ( this.a * other.b - this.b * other.a );
		const y = ( this.a * other.c - other.a * this.c ) / ( this.b * other.a - this.a * other.b );

		/* Check the domain */
		if ( isFinite ( x ) && isFinite ( y ) )
			if ( x > this.domMin.x - Line.epsilon && x < this.domMax.x + Line.epsilon && x > other.domMin.x - Line.epsilon && x < other.domMax.x + Line.epsilon )
				if ( y > this.domMin.y - Line.epsilon && y < this.domMax.y + Line.epsilon && y > other.domMin.y - Line.epsilon && y < other.domMax.y + Line.epsilon )
					return new Vec ( x, y );
		return null;
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



/**
 * @class Rect
 *
 * @description Creates a rectangle with Line's for boundaries, which allow for intersection and containment detection.
 */
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
	 * @returns {Vec[]}
	 */
	allIntercepts ( rect )
	{
		/* Return the corners if we are getting intercepts with itself */
		if ( rect === this )
			return this.corners ();

		/* Otherwise iterate over boarders */
		const intercepts = [];
		for ( const b1 of this.boarders )
			for ( const b2 of rect.boarders )
			{
				const intercept = b1.intercept ( b2 );
				if ( intercept ) intercepts.push ( intercept );
			}
		return intercepts;
	}

}



/**
 * @class Dealer
 *
 * @description Create animations for dealing cards.
 */
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
	 *
	 * @param {Number} dealDelay The delay between throwing cards.
	 * @param {Number} dealDuration The time for a card to reach its final position.
	 * @param {Number} [transJitter] The maximum translation jitter on each iteration, as a multiple of the average card dimension.
	 * @param {Number} [rotJitter] The maximum rotation jitter on each iteration, in degrees.
	 * @param {Number} [iters] The number of iterations.
	 * @public
	 */
	createAnimation ( dealDelay, dealDuration, transJitter= 0.1, rotJitter = 10, iters = 10 )
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
		this._generateNoise ( endParams, transJitter, rotJitter, iters );

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
			animations [ i ] = new CardAnim (
					d3.select ( this ),
					startParams [ i ],
					null,
					d3.easeSinOut,
					i * dealDelay )
				.continueTo (
					endParams [ i ],
					d3.easeSinOut,
					dealDuration );
		} );

		/* Return a final animation */
		return CardAnim.Delay ( this._cards, d3.easeSinOut, 0, animations );
	}



	/**
	 * @description Create the animation to deal the cards.
	 *
	 * @param {AnimParams[]} endParams The final positions to jitter.
	 * @param {Number} transJitter The maximum translation jitter on each iteration, as a multiple of the average card dimension.
	 * @param {Number} rotJitter The maximum rotation jitter on each iteration, in degrees.
	 * @param {Number} iters The number of iterations.
	 * @private
	 */
	_generateNoise ( endParams, transJitter, rotJitter, iters )
	{

		/* Create a rectangle for the deal area */
		const dealRect = new Rect ( this._dealPos.add ( this._dealSize.div ( 2 ) ), this._dealSize );

		/* Create rectangles for the cards */
		const cardRects = endParams.map ( param =>
			new Rect ( param.position.add ( this._cardSize.div ( 2 ) ), this._cardSize ) );

		/* Calculate all intercepts between all cards */
		const intercepts = [];
		const interceptsByCard = cardRects.map ( _ => [] );
		for ( let i = 0; i < cardRects.length; ++i )
		{
			/* Find intercepts with the deal area */
			const dealIntercept = {
				rect1 : cardRects [ i ],
				rect2 : dealRect,
				points : cardRects [ i ].allIntercepts ( dealRect ),
				oldPoints : null
			};

			/* Push the intercepts to their respective arrays */
			intercepts.push ( dealIntercept );
			interceptsByCard [ i ].push ( dealIntercept );

			/* Find the intercepts with other cards */
			for ( let j = i; j < cardRects.length; ++j )
			{
				/* Calculate the intercepts */
				const intercept = {
					rect1 : cardRects [ i ],
					rect2 : cardRects [ j ],
					points : cardRects [ i ].allIntercepts ( cardRects [ j ] ),
					oldPoints : null
				};

				/* Push the intercepts to their respective arrays */
				intercepts.push ( intercept );
				interceptsByCard [ i ].push ( intercept );
				interceptsByCard [ j ].push ( intercept );
			}
		}

		/* Iterate over victim rectangles */
		for ( let its = 0; its < iters; ++its )
			for ( let victim = 0; victim < cardRects.length; ++victim )
			{
				/* Create the jitter amounts */
				const rand = () => ( Math.random () * 2 - 1 );
				const trans = new Vec ( rand (), rand () )
					.mult ( this._cardSize.x + this._cardSize.y * 0.5 * transJitter )
					.clamp ( this._dealPos.sub ( cardRects [ victim ].center ), this._dealPos.add ( this._dealSize ).sub ( cardRects [ victim ].center ) );
				const rot = rand () * rotJitter;

				/* Move the victim */
				cardRects [ victim ].translate ( trans ).rotate ( Vec.rad ( rot ) );

				/* Update the victim's intercepts */
				for ( const intercept of interceptsByCard [ victim ] )
				{
					intercept.oldPoints = intercept.points;
					intercept.points = intercept.rect1.allIntercepts ( intercept.rect2 );
				}

				/* Check for bad points */
				let badNoise = false;
				for ( const intercept of intercepts )
				{
					for ( const point of intercept.points )
					{
						/* This point is fine if it is outside  the deal area */
						if ( !dealRect.containsPoint ( point ) )
							continue;

						/* Test whether the point is covered */
						let covered = false;
						for ( const rect of cardRects )
							if ( ( covered = !( intercept.rect1 === rect ) && !( intercept.rect2 === rect ) && rect.containsPoint ( point ) ) )
								break;

						/* Break if the point was not covered */
						if ( ( badNoise = !covered ) )
							break;
					}
					if ( badNoise ) break;
				}

				/* Undo the movement, if it was bad. Otherwise, commit it. */
				if ( badNoise )
				{
					cardRects [ victim ].rotate ( -Vec.rad ( rot ) ).translate ( trans.neg () );
					for ( const intercept of interceptsByCard [ victim ] )
						intercept.points = intercept.oldPoints;
				}
				else
					endParams [ victim ] = new AnimParams (
						endParams [ victim ].position.add ( trans ),
						endParams [ victim ].size,
						endParams [ victim ].rotation + rot );
			}
	}

}