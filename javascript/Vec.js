/**
 * @class Vec
 *
 * @description An immutable 2D vector.
 */
class Vec
{
	/** @public {Number} */
	x;

	/** @public {Number} */
	y;

	/**
	 * @name constructor
	 *
	 * @param {Number} [x = 0.]
	 * @param {Number} [y = 0.]
	 */
	constructor ( x = 0, y = x )
	{
		this.x = x; this.y = y;
		Object.freeze ( this );
	}

	/**
	 * @name clone
	 *
	 * @returns {Vec} A clone of this vector.
	 */
	clone ()
	{
		return new Vec ( this.x, this.y );
	}



	/**
	 * @name add
	 *
	 * @param {Vec} other
	 *
	 * @returns {Vec} A vector with other's components added to this.
	 */
	add ( other )
	{
		return new Vec ( this.x + other.x, this.y + other.y );
	}

	/**
	 * @name sub
	 *
	 * @param {Vec} other
	 *
	 * @returns {Vec} A vector with other's components subtracted from this.
	 */
	sub ( other )
	{
		return new Vec ( this.x - other.x, this.y - other.y );
	}

	/**
	 * @name mult
	 *
	 * @param {Vec|Number} other
	 *
	 * @returns {Vec} A vector with other's components multiplied by this.
	 */
	mult ( other )
	{
		if ( typeof other === "number" )
			return new Vec ( this.x * other, this.y * other );
		else
			return new Vec ( this.x * other.x, this.y * other.y );
	}

	/**
	 * @name div
	 *
	 * @param {Vec|Number} other
	 *
	 * @returns {Vec} A vector with these components divided by other.
	 */
	div ( other )
	{
		if ( typeof other === "number" )
			return new Vec ( this.x / other, this.y / other );
		else
			return new Vec ( this.x / other.x, this.y / other.y );
	}

	/**
	 * @name neg
	 *
	 * @returns {Vec} A negated vector.
	 */
	neg ()
	{
		return new Vec ( -this.x, -this.y );
	}

	/**
	 * @name clamp
	 *
	 * @param {Vec} lo
	 * @param {Vec} hi
	 *
	 * @returns {Vec} The vector clamped between the low and high vectors.
	 */
	clamp ( lo, hi )
	{
		return new Vec (
			Math.min ( Math.max ( this.x, lo.x ), hi.x ),
			Math.min ( Math.max ( this.y, lo.y ), hi.y ) );
	}

	/**
	 * @name norm
	 *
	 * @returns {Vec} A new, normalised vector.
	 */
	norm ()
	{
		return this.div ( this.length () );
	}

	/**
	 * @name length
	 *
	 * @returns {Number} The length of the vector.
	 */
	length ()
	{
		return Math.sqrt ( this.x ** 2 + this.y ** 2 );
	}

	/**
	 * @name distanceTo
	 *
	 * @param {Vec} other	The other point to calculate the distance to.
	 *
	 * @returns {Number} The distance to the other point.
	 */
	distanceTo ( other )
	{
		return this.sub ( other ).length ();
	}

	/**
	 * @name vectorTo
	 *
	 * @param {Vec} other The other point to calculate a vector to.
	 *
	 * @returns {Vec} A new vector.
	 */
	vectorTo ( other )
	{
		return other.sub ( this );
	}

	/**
	 * @name directionTo
	 *
	 * @param {Vec} other	The other point to calculate a unit vector to.
	 *
	 * @returns {Vec} A unit vector from this to other.
	 */
	directionTo ( other )
	{
		return this.vectorTo ( other ).norm ();
	}

	/**
	 * @name rotate
	 *
	 * @param {Number} rad	Angle in radians.
	 *
	 * @returns {Vec} This vector rotated anticlockwise by angle rad.
	 */
	rotate ( rad )
	{
		return new Vec (
			this.x * Math.cos ( rad ) - this.y * Math.sin ( rad ),
			this.x * Math.sin ( rad ) + this.y * Math.cos ( rad )
		);
	}

	/**
	 * @name interpolateTo
	 *
	 * @param {Vec} other	The vector to interpolate to.
	 *
	 * @returns A d3 interpolator that returns NEW vectors.
	 */
	interpolateTo ( other )
	{
		const interpolator = d3.interpolateObject ( this, other );
		return i => Vec.from ( interpolator ( i ) );
	}

	/**
	 * @name interpolateVecArray
	 *
	 * @param from	A (possible nested) array of vectors.
	 * @param to	A (possible nested) array of vectors, with the same structure as from.
	 *
	 * @returns An interpolators for the vector arrays, but wrapped so that all produced arrays are distinct objects.
	 */
	static interpolateVecArray ( from, to )
	{
		/* Create the interpolator */
		const interpolator = d3.interpolate ( from, to );

		/* Create a deep copier for vector arrays */
		const deepVecCopy = x =>
		{
			if ( Array.isArray ( x ) )
				return x.map ( e => deepVecCopy ( e ) );
			else
				return Vec.from ( x );
		};

		/* Return a wrapper on the interpolator */
		return i => deepVecCopy ( interpolator ( i ) );
	}

	/**
	 * @name from
	 *
	 * @description A static factory method, that creates a Vec from the x and y attributes of an object.
	 *
	 * @param object
	 */
	static from ( object )
	{
		if ( typeof object.x === "number" && typeof object.y === "number" )
			return new Vec ( object.x, object.y );
		else
			return new Vec ( parseFloat ( object.x ), parseFloat ( object.y ) );
	}

	/**
	 * @name rad
	 *
	 * @param {Number} deg	Angle in degrees.
	 *
	 * @returns {Number} The same angle in radians.
	 */
	static rad ( deg )
	{
		return deg * ( Math.PI / 180 );
	}

	/**
	 * @name deg
	 *
	 * @param {Number} rad	Angle in radians.
	 *
	 * @returns {Number} The same angle in degrees.
	 */
	static deg ( rad )
	{
		return ( 180 * Math.PI ) / rad;
	}
}