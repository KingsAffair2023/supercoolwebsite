


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
	 * @public {number} The width of the viewport. The height is assigned dynamically.
	 */
	static svgWidth = 1000;

	/**
	 * @public {Number} The title's margin, as a fraction of the viewport height.
	 */
	static titleMarginFrac = 0.05;

	/**
	 * @public {Number} The height of the title as a fraction of the viewport height.
	 */
	static titleHeightFrac = 0.1;

	/**
	 * @public {Number} The margin around all cards, as a fraction of the viewport height.
	 */
	static cardOuterMarginFrac = 0.05;

	/**
	 * @public {Number} The number of cards that should vertically fit on the screen including the title on a desktop.
	 */
	static verticalCardsDesktop = 2;

	/**
	 * @public {Number} The number of cards that should vertically fit on the screen including the title on a phone.
	 */
	static verticalCardsMobile = 1.5;

	/**
	 * @public {Number} The time taken to reshuffle the grid.
	 */
	static gridReshuffleDuration = 500;



	/**
	 * @private {String|null}
	 */
	_state = null;

	/**
	 * @private {Vec|null}
	 */
	_currentScreenSize;

	/**
	 * @private {Vec|null}
	 */
	_currentGrid;

	/**
	 * @private {Boolean} Whether we are busy with animations.
	 */
	_animationBusy = false;

	/**
	 * @private {Boolean}
	 */
	_cardsRequireRefresh = false;



	/**
	 * @private {Object}
	 */
	_svg;

	/**
	 * @private {Object}
	 */
	_cards;
	/**
	 * @private {Number}
	 */
	_cardRatio;

	/**
	 * @private {Number}
	 */
	_cardRatioWithMargin;

	/**
	 * @private {Vec}
	 */
	_cardMarginFrac;

	/**
	 * @private {Number[]}
	 */
	_gridWidthOptions;

	/**
	 * @private {Number}
	 */
	_verticalCards;



	/**
	 * @private {Dealer}
	 */
	_dealer;



	/**
	 * @param {Object} svg The D3 selection for the svg container.
	 * @param {Object} cards The D3 selection for the cards.
	 * @param {Object} title The D3 selection for the title image.
	 * @param {Vec} cardSize The size of the cards.
	 * @param {Vec} cardMargin The margin for cards.
	 * @param {Number[]} gridWidthOptions The options for grid width.
	 */
	constructor (
		svg,
		cards,
		title,
		cardSize,
		cardMargin,
		gridWidthOptions,
	)
	{
		/* Save the parameters */
		this._svg = svg;
		this._cards = cards;
		this._gridWidthOptions = Object.freeze ( gridWidthOptions.sort ( ( l, r ) => r - l ) );

		/* Calculate extra size information */
		this._cardRatio = cardSize.x / cardSize.y;
		this._cardRatioWithMargin = ( cardSize.x + cardMargin.x ) / ( cardSize.y + cardMargin.y );
		this._cardMarginFrac = cardSize.add ( cardMargin ).div ( cardSize );

		/* Choose the number of visible vertical cards based on whether this a mobile device or not */
		this._verticalCards = GridManager.mobileCheck () ? GridManager.verticalCardsMobile : GridManager.verticalCardsDesktop;

		/* Get the window size and grid size */
		this._currentScreenSize = GridManager.getScreenSize ();
		this._currentGrid = this._calculateGrid ( this._currentScreenSize );

		/* Get the card positions */
		const cardPositions = this._calculateCardPositions ( this._currentScreenSize, this._currentGrid );

		/* Setup the svg */
		this._svg
			.style ( "aspect-ratio", cardPositions.viewBox.x + "/" + cardPositions.viewBox.y )
			.attr ( "viewBox", "0 0 " + cardPositions.viewBox.x + " " + cardPositions.viewBox.y );

		/* Possibly disable scrolling */
		this._svg.node ().parentNode.style.overflow = ( this._currentGrid.y <= this._verticalCards ? "hidden" : "" );

		/* Create a dealer */
		this._dealer = new Dealer (
			this._cards,
			cardPositions.cardSize,
			new Vec ( 250, cardPositions.titleHeight ),
			new Vec ( 500, GridManager.svgWidth * GridManager.titleHeightFrac ),
			new Vec ( -cardPositions.cardSize.x, 0 )
		);

		/* Start the animation */
		this._dealer.createAnimation ( 100, 500 ).addCallback ( () =>
		{
			/* Add an event listener for resizing */
			window.addEventListener ( "resize", () => { this._cardsRequireRefresh = true; this.updateSVGPositions ( 0 ); } );

			/* Update the SVG positions */
			this._cardsRequireRefresh = true;
			this.updateSVGPositions ( 0, true );
		} ).animate ();
	}



	/**
	 * @public
	 */
	updateSVGPositions ( prevAnimationDuration = 0, forceFullAnimation = false )
	{
		/* Get the new screen size and change in width */
		const oldScreenSize = this._currentScreenSize;
		this._currentScreenSize = GridManager.getScreenSize ();

		/* Don't do anything if a reshuffle is in progress, or no change occurred */
		if ( this._animationBusy || !this._cardsRequireRefresh )
			return;

		/* Notify that cards no longer require refresh, and that we are now busy with animations */
		this._cardsRequireRefresh = false;
		this._animationBusy = true;

		/* Calculate the grid */
		const oldGrid = this._currentGrid;
		this._currentGrid = this._calculateGrid ( this._currentScreenSize );
		const gridChange = !oldGrid.equals ( this._currentGrid );

		/* Calculate the new card positions */
		const cardPositions = this._calculateCardPositions ( this._currentScreenSize, this._currentGrid );

		/* If there was a grid change, perform an initial update on the SVG view box */
		if ( gridChange )
		{
			/* Get the current view box height */
			const currentViewBoxHeight = parseFloat ( this._svg.attr ( "viewBox" ).split ( " " ) [ 3 ] );

			/* Calculate the initial new viewBox width and origin */
			const initialViewBoxWidth = GridManager.svgWidth * this._currentScreenSize.x / oldScreenSize.x;
			const initialViewBoxX = ( GridManager.svgWidth - initialViewBoxWidth ) / 2;

			/* Transition the SVG element */
			this._svg
				.attr ( "viewBox", initialViewBoxX + " 0 " + initialViewBoxWidth + " " + currentViewBoxHeight )
				.style ( "aspect-ratio", initialViewBoxWidth + "/" + currentViewBoxHeight );

			/* Possibly disable scrolling */
			this._svg.node ().parentNode.style.overflow = ( this._currentGrid.y <= this._verticalCards ? "hidden" : "" );
		}

		/* Calculate the animation duration */
		const animationDuration = ( gridChange || forceFullAnimation ) ? GridManager.gridReshuffleDuration : prevAnimationDuration / 2;

		/* Animate the view box changing */
		this._svg
			.transition ()
			.duration ( animationDuration )
			.ease ( d3.easeSinInOut )
			.style ( "aspect-ratio", cardPositions.viewBox.x + "/" + cardPositions.viewBox.y )
			.attr ( "viewBox", "0 0 " + cardPositions.viewBox.x + " " + cardPositions.viewBox.y );

		/* Animate the cards moving */
		new Anim ( this._cards, null, cardPositions.positions, d3.easeSinInOut, animationDuration )
			.addCallback ( () =>
			{
				this._animationBusy = false;
				this.updateSVGPositions ( animationDuration / 2 );
			} )
			.animate ();
	}



	/**
	 * @param {Vec} screenSize
	 * @param {Vec} grid
	 * @returns {{cardSize: Vec, viewBox: Vec, positions: AnimParams[], titleHeight: Number}}
	 * @private
	 */
	_calculateCardPositions ( screenSize, grid )
	{
		/* Calculate the dimensions of the visible SVG viewport */
		const visibleSVGViewport = new Vec ( GridManager.svgWidth, GridManager.svgWidth * screenSize.y / screenSize.x );

		/* Calculate the size of a card with its margin */
		const cardHeightWithMargin = visibleSVGViewport.y * ( 1 - GridManager.titleHeightFrac - 2 * GridManager.cardOuterMarginFrac - 2 * GridManager.titleMarginFrac ) / this._verticalCards;
		const cardSizeWithMargin = new Vec ( this._cardRatioWithMargin * cardHeightWithMargin, cardHeightWithMargin );

		/* Calculate the margin size */
		const cardSize = cardSizeWithMargin.div ( this._cardMarginFrac );
		const marginSize = cardSizeWithMargin.sub ( cardSize );

		/* Calculate the corner offset */
		const cornerOffset = new Vec (
			( visibleSVGViewport.x - ( grid.x * cardSizeWithMargin.x ) + marginSize.x ) / 2,
			visibleSVGViewport.y * ( GridManager.titleHeightFrac + GridManager.cardOuterMarginFrac + GridManager.titleMarginFrac * 2 ) + marginSize.y / 2 );

		/* Create the positions */
		const positions = [];
		for ( let y = 0; y < grid.y; ++y )
			for ( let x = 0; x < grid.x && y * grid.x + x < this._cards.size (); ++x )
				positions.push ( new AnimParams (
					cornerOffset.add ( cardSizeWithMargin.mult ( new Vec ( x, y ) ) ),
					cardSize,
					0 ) );

		/* Calculate the height of the top of title */
		const titleHeight = visibleSVGViewport.y * GridManager.titleMarginFrac;

		/* Calculate the final viewport dimensions */
		const viewportDimensions = new Vec (
			GridManager.svgWidth,
			positions [ positions.length - 1 ].position.y + cardSize.y + marginSize.y / 2 + visibleSVGViewport.y * GridManager.cardOuterMarginFrac );

		/* Return the information */
		return {
			cardSize: cardSize,
			viewBox: viewportDimensions,
			positions: positions,
			titleHeight: titleHeight
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
		const hCards = cardAreaRatio * this._verticalCards / this._cardRatioWithMargin;

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