/**
 * @class Card
 *
 * @description Describes the capabilities of a card.
 */
class Card
{

	/**
	 * @public {Object} The D3 selection for the SVG element.
	 */
	svg;

	/**
	 * @public {Object} The D3 selection of the foreign object which contains the card.
	 */
	card;

	/**
	 * @public {Object} The D3 selection of the div element.
	 */
	cardDiv;

	/**
	 * @public {Object} The D3 selection of the img element.
	 */
	cardImg;

	/**
	 * @public {Vec}
	 */
	size;

	/**
	 * @public {String} The image to put on the card.
	 */
	src;

	/**
	 * @public {(function():Promise<void>)|null} The action to perform when clicked.
	 */
	onClick;

	/**
	 * @public {Boolean} Whether cards should be hidden on clicking.
 	 */
	hideCardsOnClick;



	/**
	 * @param {Object} svg
	 * @param {String} src
	 * @param {Vec} size
	 * @param {(function():Promise<void>)|null} [onClick = null]
	 * @param {Boolean} [hideCardsOnClick = false]
	 */
	constructor (
		svg,
		src,
		size,
		onClick= null,
		hideCardsOnClick= false )
	{
		/* Save parameters */
		this.svg = svg;
		this.src = src;
		this.size = size;
		this.onClick = onClick;
		this.hideCardsOnClick = hideCardsOnClick;

		/* Create the foreign object */
		this.card = this.svg.append ( "g" ).append ( "foreignObject" )
			.classed ( "card", true )
			.attr ( "width", this.size.x )
			.attr ( "height", this.size.y );

		/* Append the div */
		this.cardDiv = this.card.append ( "xhtml:body" )
			.attr ( "xmlns", "http://www.w3.org/1999/xhtml" )
			.classed ( "card-div", true );

		/* Append the image */
		this.cardImg = this.cardDiv.append ( "xhtml:img" )
			.classed ( "card-img", true )
			.attr ( "src", this.src );
	}

}