/**
 * @class AnimParams
 *
 * @description Start and end parameters for an animation.
 */
class AnimParams
{
	/** @public {?Vec} */
	position;

	/** @public {?Number} */
	rotation;

	/** @public {?Number} */
	scale;



	/**
	 * @param {Vec|null} position
	 * @param {Number|null} rotation
	 * @param {Number|null} scale
	 */
	constructor ( position= null, rotation= null, scale= null )
	{
		this.position = position;
		this.rotation = rotation;
		this.scale = scale;
		Object.freeze ( this );
	}



	/**
	 * @returns {String}
	 * @public
	 */
	toTransform ()
	{
		return ( this.position != null ? "translate(" + this.position.x + "px," + this.position.y + "px)" : "" ) +
			( this.rotation != null ? "rotate(" + this.rotation + "deg)" : "" ) +
			( this.scale != null ? "scale(" + this.scale + ")" : "" );
	}



	/**
	 * @returns {AnimParams}
	 * @constructor
	 */
	static Empty ()
	{
		return new AnimParams ();
	}
}



/**
 * @class Anim
 */
class Anim
{

	/** @public */
	selection;

	/** @public {AnimParams|AnimParams[]|null} */
	startParams;

	/** @public {AnimParams|AnimParams[]|null} */
	endParams;

	/** @public {Boolean} */
	arrayParams;

	/** @public {Object} */
	ease;

	/** @public {Number} */
	duration;

	/** @public {Anim[]} */
	dependsOn;

	/** @public {(function():void)|null} */
	callback;



	/**
	 * @param {Object} selection The D3 selection which the animation should act on.
	 * @param {AnimParams|AnimParams[]|null} startParams
	 * @param {AnimParams|AnimParams[]|null} endParams
	 * @param {Object} ease A D3 ease object, which describes the interpolation function for the animation.
	 * @param {Number} duration
	 * @param {Anim[]} [dependsOn = []] Any animations which the start of this animation depends on.
	 * @param {(function():void)|null} callback
	 */
	constructor (
		selection,
		startParams,
		endParams,
		ease, duration,
		dependsOn = [],
		callback = null )
	{
		/* Check array parameters */
		if ( !startParams )
		{
			if ( !endParams ) this.arrayParams = false;
			else this.arrayParams = Array.isArray ( endParams );
		}
		else
		{
			this.arrayParams = Array.isArray ( startParams );
			if ( endParams && Array.isArray ( endParams ) !== this.arrayParams )
				throw new Error ( "ParallelAnimation.constructor: startParams and endParams must both be an array, or both objects" );
		}

		/* Check cardinalities */
		if ( this.arrayParams )
			if ( ( startParams && selection.size () !== startParams.length ) || ( endParams && selection.size () !== endParams.length ) )
				throw new Error ( "ParallelAnimation.constructor: Assertion 'selection.size () == startParams.length == endParams.length' failed" );

		this.selection = selection;
		this.startParams = ( this.arrayParams ? startParams?.slice () : startParams );
		this.endParams = ( this.arrayParams ? endParams?.slice () : endParams );
		this.ease = ease;
		this.duration = duration;
		this.dependsOn = dependsOn.slice ();
		this.callback = callback;
	}



	/**
	 * @description Animate the entire dependency tree.
	 *
	 * @param {Object} [promises = {}] An object with SingleAnimation objects as keys, storing promises for their respective animations.
	 * @returns {Object} The updated promises object.
	 * @public
	 */
	animate ( promises= {} )
	{
		/* Ignore if we are already animating */
		if ( promises.hasOwnProperty ( this ) )
			return promises;

		/* Create an array of animation promises that this node depends on */
		const depPromises = []
		for ( const dep of this.dependsOn )
		{
			dep.animate ( promises );
			depPromises.push ( promises [ dep ] );
		}

		/* Add the promise for this animation */
		promises [ this ] = Promise.all ( depPromises ).then ( () => this._animate () );
		return promises;
	}



	/**
	 * @param {Anim} anim
	 * @returns {Anim}
	 */
	followedBy ( anim )
	{
		anim.dependsOn.push ( this );
		return anim;
	}



	/**
	 * @param {Anim} anim
	 * @returns {Anim}
	 */
	addDependency ( anim )
	{
		this.dependsOn.push ( anim );
		return this;
	}



	/**
	 * @param {AnimParams|AnimParams[]|null} endParams
	 * @param {Object|null} [ease = null]
	 * @param {Number|null} [duration = null]
	 * @returns {Anim}
	 * @public
	 */
	continueTo ( endParams, ease= null, duration= null )
	{
		return new Anim (
			this.selection,
			null, endParams,
			ease ? ease : this.ease,
			duration != null ? duration : this.duration,
			[ this ]
		);
	}



	/**
	 * @param {Number} index
	 * @param {AnimParams|AnimParams[]|null} endParams
	 * @param {Object|null} [ease = null]
	 * @param {Number|null} [duration = null]
	 * @returns {Anim}
	 * @public
	 */
	singleContinueTo ( index, endParams, ease= null, duration= null )
	{
		return new Anim (
			this.selection.filter ( ( d, i ) => i === index ),
			null,
			endParams,
			ease ? ease : this.ease,
			duration != null ? duration : this.duration,
			[ this ]
		);
	}



	/**
	 * @param {function():void} f
	 */
	addCallback ( f )
	{
		const oldCallback = this.callback;
		this.callback = ( this.callback ? () => { oldCallback (); f () } : f );
		return this;
	}



	/**
	 * @description Actually perform the animation for this node.
	 * @private
	 */
	_animate ()
	{
		/* The return animation */
		let promise;

		/* Animate */
		if ( this.arrayParams )
		{
			if ( this.startParams )
				this.selection
					.data ( this.startParams )
					.join ()
					.style ( "transform", d => d.toTransform () );
			if ( this.endParams )
				promise = this.selection
					.data ( this.endParams )
					.join ()
					.transition ()
					.duration ( this.duration )
					.ease ( this.ease )
					.style ( "transform", d => d.toTransform () )
					.end ()
			else promise = new Promise ( res => setTimeout ( () => res (), this.duration ) );
		} else
		{
			if ( this.startParams )
				this.selection.style ( "transform", this.startParams.toTransform () );
			if ( this.endParams )
				promise = this.selection
					.transition ()
					.duration ( this.duration )
					.ease ( this.ease )
					.style ( "transform", this.endParams.toTransform () )
					.end ()
			else promise = new Promise ( res => setTimeout ( () => res (), this.duration ) )
		}

		/* Add the callback and return */
		return promise.then ( () => { if ( this.callback ) this.callback (); } );
	}



	/**
	 * @param {Object} selection The D3 selection which the animation should act on.
	 * @param {Object} ease A D3 ease object, which describes the interpolation function for the animation.
	 * @param {Number} duration
	 * @param {Anim[]} [dependsOn = []] Any animations which the start of this animation depends on.
	 * @constructor
	 */
	static Identity ( selection, ease, duration, dependsOn = [] )
	{
		return new Anim ( selection, null, null, ease, duration, dependsOn );
	}

	/**
	 * @param {Object} selection The D3 selection which the animation should act on.
	 * @param {Object} ease A D3 ease object, which describes the interpolation function for the animation.
	 * @param {Number} duration
	 * @param {Anim[]} [dependsOn = []] Any animations which the start of this animation depends on.
	 * @constructor
	 */
	static Setup ( selection, ease, duration, dependsOn = [] )
	{
		return new SetupAnim ( selection, ease, duration, dependsOn );
	}
}


/**
 * @class SetupAnim
 * @extends Anim
 *
 * @description Stores the parameters for a normal animation, but _animate resolves immediately, having no effect.
 */
class SetupAnim extends Anim
{
	/**
	 * @param {Object} selection The D3 selection which the animation should act on.
	 * @param {Object} ease A D3 ease object, which describes the interpolation function for the animation.
	 * @param {Number} duration
	 * @param {Anim[]} [dependsOn = []] Any animations which the start of this animation depends on.
	 */
	constructor ( selection, ease, duration, dependsOn = [] )
	{
		super ( selection, null, null, ease, duration, dependsOn );
	}

	/**
	 * @description Actually perform the animation for this node.
	 * @private
	 * @override
	 */
	_animate ()
	{
		return Promise.resolve ();
	}
}