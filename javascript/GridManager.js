


/**
 * @class GridManager
 *
 * @description Sets up the main page of cards. Forms the following state machine:
 *
 * ----> GRID <---> HIDDEN
 * 		 ^  ^
 * 		 |  |
 * 		 *--*
 *
 * State descriptions:
 *
 * GRID: The cards are distributed on the page.
 * HIDDEN: The cards are hidden off to the side while another page appears.
 *
 * Transition descriptions:
 *
 * --> GRID: The cards are dealt over the title, and then move to form the grid.
 * GRID -> GRID: The grid is reshaped based on the dimensions of the page.
 * GRID <-> HIDDEN: The cards move off and on the page to allow for other pages to appear.
 */
class GridManager
{

	/**
	 * @public {Readonly<{GRID: string, HIDDEN: string}>}
	 */
	static states = Object.freeze ( {
		GRID : "GRID",
		HIDDEN : "HIDDEN"
	} );



	/**
	 * @public {Boolean} Whether we are on mobile.
	 */
	static mobile = GridManager.mobileCheck ();



	/**
	 * @public {Number} The title's margin, as a fraction of the viewport height.
	 */
	static titleMarginFrac = 0.07;

	/**
	 * @public {Number} The title's absolute horizontal margin.
	 */
	static titleHorizontalMargin = 50;

	/**
	 * @public {Number} The height of the title as a fraction of the viewport height.
	 */
	static titleHeightFrac = 0.2;

	/**
	 * @public {Number} The margin around all cards, as a fraction of the viewport height.
	 */
	static cardOuterMarginFrac = 0.02;

	/**
	 * @public {Number} The number of cards that should vertically fit on the screen including the title on a desktop.
	 */
	static verticalCardsDesktop = 1.3;

	/**
	 * @public {Number} The number of cards that should vertically fit on the screen including the title on a phone.
	 */
	static verticalCardsMobile = 1.1;

	/**
	 * @private {Number} The number of vertical cards
	 */
	static verticalCards = GridManager.mobile ? GridManager.verticalCardsMobile : GridManager.verticalCardsDesktop;



	/**
	 * @public {Number} The delay between dealing cards.
	 */
	static dealDelay = 80;

	/**
	 * @public {Number} The time taken to draw a card.
	 */
	static dealDuration = 400;

	/**
	 * @public {Number} The time taken to form the grid initially.
	 */
	static initialGridFormationDuration = 500;

	/**
	 * @public {Number} The time taken to reshuffle the grid.
	 */
	static gridReshuffleDuration = 400;

	/**
	 * @public {Number} The time taken to hide and show cards.
	 */
	static hideShowCardDuration = 250;

	/**
	 * @public {Number} The time taken to perform animations on mobile.
	 */
	static mobileSmoothingDuration = 400;

	/**
	 * @public {Number} The period at which to refresh the grid (just in case).
	 */
	static positionUpdateInterval = 1500;



	/**
	 * @private {Vec}
	 */
	_currentScreenSize;

	/**
	 * @private {Vec}
	 */
	_currentGrid;

	/**
	 * @private {Number} As an index of _titles.
	 */
	_currentTitle;

	/**
	 * @private {Boolean} Whether we are busy with animations.
	 */
	_animationBusy = false;



	/**
	 * @private {Object}
	 */
	_canvas;

	/**
	 * @private {Object}
	 */
	_cards;

	/**
	 * @private {Object}
	 */
	_titles;

	/**
	 * @private {Number}
	 */
	_cardRatio;

	/**
	 * @private {Number}
	 */
	_cardRatioWithMargin;

	/**
	 * @private {Vec} cardSize / cardSizeWithMargin
	 */
	_cardMarginFrac;

	/**
	 * @private {Vec[]} Ascpect ratios for the titles in decreasing order.
	 */
	_titleRatios;

	/**
	 * @private {Number[]}
	 */
	_gridWidthOptions;

	/**
	 * @private {(function():void)|null}
	 */
	_setupCallback;



	/**
	 * @private {Dealer}
	 */
	_dealer;

	/**
	 * @private {String}
	 */
	_currentState;

	/**
	 * @private {String}
	 */
	_nextState;



	/**
	 * @param {Object} canvas The D3 selection for the canvas.
	 * @param {Object} cards The D3 selection for the cards.
	 * @param {Object} titles The D3 selection for the title images.
	 * @param {Vec} cardSize The size of the cards.
	 * @param {Vec} cardMargin The margin for cards.
	 * @param {Vec[]} titleSizes The size of each title in the selection.
	 * @param {Number[]} gridWidthOptions The options for grid width.
	 * @param {(function():void)|null} setupCallback A callback function for when the grid is first set up.
	 */
	constructor (
		canvas,
		cards,
		titles,
		cardSize,
		cardMargin,
		titleSizes,
		gridWidthOptions,
		setupCallback
	)
	{
		/* PARAMETER SETUP */

		/* Save the parameters */
		this._canvas = canvas;
		this._titles = titles;
		this._cards = cards;
		this._gridWidthOptions = gridWidthOptions.slice ().sort ( ( l, r ) => r - l );
		this._setupCallback = setupCallback;

		/* Calculate card size information */
		this._cardRatio = cardSize.x / cardSize.y;
		this._cardRatioWithMargin = ( cardSize.x + cardMargin.x ) / ( cardSize.y + cardMargin.y );
		this._cardMarginFrac = cardSize.add ( cardMargin ).div ( cardSize );

		/* Calculate title ratio information */
		if ( this._titles.size () !== titleSizes.length )
			throw new Error ( "GridManager.constructor: titles and titleSizes should be the same length" );
		this._titleRatios = titleSizes.map ( size => size.x / size.y );

		/* Sort the title ratios */
		this._titles = this._titles.data ( this._titleRatios ).sort ( ( l, r ) => r - l );
		this._titleRatios.sort ( ( l, r ) => r - l );

		/* Ensure that the cards are still on top */
		this._cards.raise ();



		/* INITIAL CANVAS SETUP */

		/* Get the layout and set up the memory attributes */
		this._currentScreenSize = GridManager.getScreenSize ();
		const layout = this._calculateLayout ( this._currentScreenSize );
		this._currentGrid = layout.grid;
		this._currentTitle = layout.titleChoice;

		/* Set the states */
		this._currentState = null;
		this._nextState = GridManager.states.GRID;

		/* Set up the canvas */
		this._canvas
			.style ( "width", layout.canvasDimensions.x + "px" )
			.style ( "height", layout.canvasDimensions.y + "px" );

		/* Possibly disable scrolling and scroll to the top */
		document.scrollingElement.overflowY = ( this._currentGrid.y <= GridManager.verticalCards ? "hidden" : "" );
		document.scrollingElement.scrollTop = 0;

		/* Ensure that the titles are hidden */
		this._titles.style ( "visibility", "hidden" );

		/* Position the title */
		d3.select ( this._titles.nodes () [ this._currentTitle ] )
			.style ( "transition-duration", "0s" )
			.style ( "left", layout.titlePos.x + "px" )
			.style ( "top", layout.titlePos.y + "px" )
			.style ( "width", layout.titleSize.x + "px" )
			.style ( "height", layout.titleSize.y + "px" )



		/* DEAL ANIMATION */

		/* Create a dealer */
		this._dealer = new Dealer (
			this._cards,
			layout.cardSize,
			layout.titlePos,
			layout.titleSize,
			new Vec ( -layout.cardSize.x, layout.titlePos.y )
		);

		/* Start the animation */
		this._animationBusy = true;
		this._dealer.createAnimation ( GridManager.dealDelay, GridManager.dealDuration ).addCallback ( () =>
		{
			/* Show the title */
			d3.select ( this._titles.nodes () [ this._currentTitle ] )
				.style ( "visibility", "visible" );

			/* Update the card positions */
			this._animationBusy = false;
			this.updatePositions ();

			/* Add an event listener for screen resizing and an interval */
			window.addEventListener ( "resize", () => this.updatePositions () );
			setInterval ( () => this.updatePositions (), GridManager.positionUpdateInterval );
		} ).animate ();
	}



	/**
	 * @description Request that the cards are hidden off the screen.
	 */
	hideCards ()
	{
		this._nextState = GridManager.states.HIDDEN;
		this.updatePositions ();
	}

	/**
	 * @description Request that the cards are not hidden off the screen.
	 */
	showCards ()
	{
		this._nextState = GridManager.states.GRID;
		this.updatePositions ();
	}



	/**
	 * @description Reposition the canvas and animate the cards and title, transitioning from state to nextState.
	 * @param {Number} prevAnimationDuration The duration of the previous animation.
	 */
	updatePositions ( prevAnimationDuration = 0 )
	{
		/* Get the new screen size */
		const newScreenSize = GridManager.getScreenSize ();

		/* Don't do anything if a reshuffle is in progress, or if there is no need */
		if ( this._animationBusy || ( this._nextState === this._currentState && newScreenSize.equals ( this._currentScreenSize ) ) )
			return;



		/* GATHER PARAMETERS */

		/* Set the new screen size */
		this._currentScreenSize = newScreenSize;

		/* Calculate the new layout */
		const layout = this._calculateLayout ( this._currentScreenSize );

		/* Get whether the grid and title have changed */
		const gridChange = !this._currentGrid.equals ( layout.grid );
		const titleChange = ( this._currentTitle !== layout.titleChoice );

		/* Get title selections */
		const newTitleSel = d3.select ( this._titles.nodes () [ layout.titleChoice ] );
		const oldTitleSel = d3.select ( this._titles.nodes () [ this._currentTitle ] );



		/* INITIAL RESIZING */

		/* If the cards are hidden, we can simply jump to the new canvas settings */
		if ( this._currentState === GridManager.states.HIDDEN )
		{
			/* Reposition the cards */
			new CardAnim ( this._cards, layout.hiddenCardPositions, null, "ease-in-out", 0 ).animate ();

			/* Set up the canvas */
			this._canvas
				.style ( "transition-duration", "0s" )
				.style ( "width", layout.canvasDimensions.x + "px" )
				.style ( "height", layout.canvasDimensions.y + "px" );

			/* Position the title */
			newTitleSel
				.style ( "transition-duration", "0s" )
				.style ( "visibility", "visible" )
				.style ( "left", layout.titlePos.x + "px" )
				.style ( "top", layout.titlePos.y + "px" )
				.style ( "width", layout.titleSize.x + "px" )
				.style ( "height", layout.titleSize.y + "px" );
		}

		/* If the cards are not hidden, we will animate the canvas changing.
		 * Therefore, if we have also changed title,
		 * we need to give the new title a special initial position and size.
		 */
		else if ( titleChange )
		{
			/* Get the old canvas size */
			const oldCanvasWidth = parseFloat ( this._canvas.style ( "width" ) );

			/* Get the old title's height and top position */
			const oldTitleHeight = parseFloat ( oldTitleSel.style ( "height" ) );
			const oldTitleY = parseFloat ( oldTitleSel.style ( "top" ) );

			/* Calculate the size and position of the new title based on the old title */
			const newTitleSize = new Vec ( this._titleRatios [ layout.titleChoice ] * oldTitleHeight, oldTitleHeight );
			const newTitlePos = new Vec ( ( oldCanvasWidth - newTitleSize.x ) / 2, oldTitleY );

			/* Position the title */
			newTitleSel
				.style ( "transition-duration", "0s" )
				.style ( "visibility", "visible" )
				.style ( "left", newTitlePos.x + "px" )
				.style ( "top", newTitlePos.y + "px" )
				.style ( "width", newTitleSize.x + "px" )
				.style ( "height", newTitleSize.y + "px" );
		}

		/* Hide any old title */
		if ( titleChange )
			oldTitleSel
				.style ( "transition-duration", "0s" )
				.style ( "visibility", "hidden" );



		/* ANIMATE */

		/* If we are going from a hidden state to a hidden state, we don't need to animate */
		if ( !( this._currentState === GridManager.states.HIDDEN && this._nextState === GridManager.states.HIDDEN ) )
		{
			/* Notify that animations are now in progress */
			this._animationBusy = true;

			/* Calculate the animation position, duration, and ease */
			let animationPosition = layout.cardPositions;
			let animationDuration = GridManager.mobile ? GridManager.mobileSmoothingDuration : prevAnimationDuration / 2;
			let animationEase = "ease-in-out";
			if ( this._nextState === GridManager.states.HIDDEN )
				[ animationPosition, animationDuration, animationEase ] = [ layout.hiddenCardPositions, GridManager.hideShowCardDuration, "ease-in" ];
			else if ( this._currentState === GridManager.states.HIDDEN )
				[ animationDuration, animationEase ] = [ GridManager.hideShowCardDuration, "ease-out" ];
			else if ( !this._currentState )
				animationDuration = GridManager.initialGridFormationDuration;
			else if ( gridChange )
				animationDuration = GridManager.gridReshuffleDuration;

			/* Resize the current title if we haven't already */
			if ( this._currentState !== GridManager.states.HIDDEN )
				setTimeout ( () => newTitleSel
					.style ( "transition-property", "left, top, width, height" )
					.style ( "transition-duration", animationDuration + "ms" )
					.style ( "transition-timing-function", "ease-in-out" )
					.style ( "left", layout.titlePos.x + "px" )
					.style ( "top", layout.titlePos.y + "px" )
					.style ( "width", layout.titleSize.x + "px" )
					.style ( "height", layout.titleSize.y + "px" ) );

			/* Animate the cards moving */
			new CardAnim (
				this._cards,
				null,
				animationPosition,
				animationEase,
				animationDuration )
				.addCallback ( () =>
				{
					/* Possibly call the setup callback if it exists */
					if ( this._setupCallback ) this._setupCallback ();
					this._setupCallback = null;

					/* Make sure we scrolled to the top */
					if ( gridChange && GridManager.mobile )
						document.scrollingElement.scrollTop = 0;

					/* Possibly disable scrolling */
					document.scrollingElement.overflowY = ( layout.grid.y <= GridManager.verticalCards ? "hidden" : "" );

					/* Check that positions are still correct after the animation */
					this._animationBusy = false;
					this.updatePositions ( animationDuration );
				} )
				.animate ();

			/* Animate the canvas changing */
			setTimeout ( () => this._canvas
				.style ( "transition-property", "width, height" )
				.style ( "transition-duration", animationDuration + "ms" )
				.style ( "transition-timing-function", "ease-in-out" )
				.style ( "width", layout.canvasDimensions.x + "px" )
				.style ( "height", layout.canvasDimensions.y + "px" ) );
		}

		/* Set the new state */
		this._currentState = this._nextState;
		this._currentGrid = layout.grid;
		this._currentTitle = layout.titleChoice;
	}



	/**
	 * @param {Vec} screenSize
	 * @param {Number} hiddenCardPositionJitter The maximum position jitter of hidden cards, as a fraction of the average card dimension.
	 * @param {Number} hiddenCardAngleJitter The absolute maximum angle of hidden cards, in degrees.
	 * @returns {{grid: Vec, cardSize: Vec, canvasDimensions: Vec, cardPositions: AnimParams[], hiddenCardPositions: AnimParams[], titleChoice: Number, titleSize: Vec, titlePos: Vec}}
	 * @private
	 */
	_calculateLayout ( screenSize, hiddenCardPositionJitter = 1, hiddenCardAngleJitter = 45 )
	{
		/* CALCULATE CARD AND VIEWPORT SIZES */

		/* Calculate the grid */
		const grid = this._calculateGrid ( screenSize );

		/* Calculate the size of a card with its margin */
		const cardHeightWithMargin = screenSize.y * ( 1 - GridManager.titleHeightFrac - 2 * GridManager.cardOuterMarginFrac - 2 * GridManager.titleMarginFrac ) / GridManager.verticalCards;
		const cardSizeWithMargin = new Vec ( this._cardRatioWithMargin * cardHeightWithMargin, cardHeightWithMargin );

		/* Calculate the margin size */
		const cardSize = cardSizeWithMargin.div ( this._cardMarginFrac );
		const marginSize = cardSizeWithMargin.sub ( cardSize );



		/* CALCULATE CANVAS DIMENSIONS */

		/* Calculate the final canvas dimensions */
		const canvasDimensions = new Vec (
			screenSize.x,
			screenSize.y * ( GridManager.titleHeightFrac + 2 * GridManager.titleMarginFrac + 2 * GridManager.cardOuterMarginFrac ) + cardSizeWithMargin.y * grid.y );



		/* CHOOSE A TITLE AND CALCULATE ITS SIZE AND POSITION */

		/* Calculate the height of the title and the area's aspect ratio */
		const theoreticalTitleHeight = screenSize.y * GridManager.titleHeightFrac;
		const titleAreaRatio = ( screenSize.x - 2 * GridManager.titleHorizontalMargin ) / theoreticalTitleHeight;

		/* Choose the best title to fit the space */
		let titleChoice = null;
		for ( let i = 0; i < this._titleRatios.length && titleChoice === null; ++i )
			if ( this._titleRatios [ i ] < titleAreaRatio || i === this._titleRatios.length - 1 )
				titleChoice = i;

		/* Calculate the title position and size */
		const titleWidth = Math.min ( this._titleRatios [ titleChoice ] * theoreticalTitleHeight, screenSize.x - 2 * GridManager.titleHorizontalMargin );
		const titleSize = new Vec ( titleWidth, titleWidth / this._titleRatios [ titleChoice ] );
		const titlePos = new Vec (
			( screenSize.x - titleSize.x ) / 2,
			screenSize.y * GridManager.titleMarginFrac );



		/* CALCULATE CARD POSITIONS */

		/* Calculate the corner offset for cards in the grid */
		const cornerOffset = new Vec (
			( screenSize.x - ( grid.x * cardSizeWithMargin.x ) + marginSize.x ) / 2,
			titleSize.y + screenSize.y * ( GridManager.cardOuterMarginFrac + GridManager.titleMarginFrac * 2 ) + marginSize.y / 2 );

		/* Calculate the offset of bottom row cards */
		const cardsOnBottomRow = this._cards.size () - ( grid.x * ( grid.y - 1 ) );
		const bottomRowOffset = new Vec ( ( grid.x - cardsOnBottomRow ) * cardSizeWithMargin.x / 2, 0 );

		/* Calculate the card positions */
		const cardPositions = [];
		for ( let y = 0; y < grid.y; ++y )
			for ( let x = 0; x < grid.x && y * grid.x + x < this._cards.size (); ++x )
				cardPositions.push ( new AnimParams (
					cornerOffset.add ( cardSizeWithMargin.mult ( new Vec ( x, y ) ) )
						.add ( y === grid.y - 1 ? bottomRowOffset : new Vec () ),
					cardSize,
					0 ) );



		/* CALCULATE HIDDEN CARD POSITIONS */

		/* Get whether the grid layout is longer horizontally than it is vertically. Favour vertical. */
		const gridIsHorizontal = grid.x > grid.y;

		/* Get the size of a card from corner to corner */
		const cardCornerToCorner = Math.sqrt ( cardSize.x ** 2 + cardSize.y ** 2 );

		/* Get hidden card position interpolators */
		const hiddenCardPositionInterpolators = gridIsHorizontal ? [
				new Vec ( 0, -cardCornerToCorner ).interpolateTo ( new Vec ( canvasDimensions.x - cardSize.x, -cardCornerToCorner ) ),
				new Vec ( 0, canvasDimensions.y + cardCornerToCorner - cardSize.y ).interpolateTo ( new Vec ( canvasDimensions.x - cardSize.x, canvasDimensions.y + cardCornerToCorner - cardSize.y ) ),
			] : [
				new Vec ( -cardCornerToCorner, 0 ).interpolateTo ( new Vec ( -cardCornerToCorner, canvasDimensions.y - cardSize.y ) ),
				new Vec ( canvasDimensions.x + cardCornerToCorner - cardSize.x, 0 ).interpolateTo ( new Vec ( canvasDimensions.x + cardCornerToCorner - cardSize.x, canvasDimensions.y - cardSize.y ) )
			];

		/* Calculate hidden card positions */
		const hiddenCardPositions = [];
		for ( let y = 0; y < grid.y; ++y )
			for ( let x = 0; x < grid.x && y * grid.x + x < this._cards.size (); ++x )
			{
				/* Get the card index */
				const i = y * grid.x + x;

				/* Calculate which edge the card should be hidden on */
				const hideCardOnPositiveEdge = gridIsHorizontal ?
					y > ( ( grid.y / 2 ) - 0.5 ) + ( 0.1 * ( -1 ) ** x ):
					x > ( ( grid.x / 2 ) - 0.5 ) + ( 0.1 * ( -1 ) ** y );

				/* Calculate the fraction along the edge that card should be */
				const hideCardAtFractionAlongEdge = gridIsHorizontal ?
					x / ( grid.x - 1 ) :
					y / ( grid.y - 1 );

				/* Calculate jitter */
				const rand = () => ( Math.random () * 2 - 1 );
				const positionJitter = new Vec ( hiddenCardPositionJitter * ( cardSize.x + cardSize.y ) * 0.5 * rand () )
					.mult ( new Vec ( gridIsHorizontal ? 1 : 0, gridIsHorizontal ? 0 : 1 ) );
				const rotationJitter = hiddenCardAngleJitter * rand ();

				/* Set the card position */
				hiddenCardPositions [ i ] = new AnimParams (
					hiddenCardPositionInterpolators [ hideCardOnPositiveEdge ? 1 : 0 ] ( hideCardAtFractionAlongEdge )
						.add ( positionJitter ),
					cardSize,
					rotationJitter );
			}



		/* RETURN */

		/* Return the layout information */
		return {
			grid: grid,
			cardSize: cardSize,
			canvasDimensions: canvasDimensions,
			cardPositions: cardPositions,
			hiddenCardPositions: hiddenCardPositions,
			titleChoice: titleChoice,
			titleSize: titleSize,
			titlePos: titlePos
		};
	}



	/**
	 * @param {Vec} screenSize
	 * @returns {Vec}
	 * @private
	 */
	_calculateGrid ( screenSize )
	{
		/* Get the ratio of the screen, excluding the title and margins */
		const cardAreaRatio = ( screenSize.x / screenSize.y ) / ( 1 - GridManager.titleHeightFrac - 2 * GridManager.cardOuterMarginFrac - 2 * GridManager.titleMarginFrac );

		/* Get the maximum number of horizontal cards */
		const hCards = cardAreaRatio * GridManager.verticalCards / this._cardRatioWithMargin;

		/* Find the best option */
		for ( const widthOption of this._gridWidthOptions )
			if ( widthOption <= hCards )
				return new Vec ( widthOption, Math.ceil ( this._cards.size () / widthOption ) );

		/* Otherwise choose the minimum allowed grid width */
		const minGridWidth = this._gridWidthOptions [ this._gridWidthOptions.length - 1 ];
		return new Vec ( minGridWidth, Math.ceil ( this._cards.size () / minGridWidth ) );
	}



	/**
	 * @see {@link http://detectmobilebrowsers.com/ DetectMobileBrowsers}
	 */
	static mobileCheck ()
	{
		let check = false;
		(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	};

	/**
	 * @returns {Vec}
	 */
	static getScreenSize ()
	{
		return new Vec ( window.innerWidth, window.innerHeight );
	}

}