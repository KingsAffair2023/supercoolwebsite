const position = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
// Bonus values for future extension
let counter = 0;

/**
 * @class Card
 *
 * @description Describes the capabilities of a card.
 */
class Card
{

	/**
	 * @public {Object} The D3 selection for the containing div element.
	 */
	canvas;

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
	 * @param {Object} canvas
	 * @param {String} src
	 * @param {Vec} size
	 * @param {(function():Promise<void>)|null} [onClick = null]
	 * @param {Boolean} [hideCardsOnClick = false]
	 */
	constructor (
		canvas,
		src,
		size,
		onClick= null,
		hideCardsOnClick= false )
	{
		/* Save parameters */
		this.canvas = canvas;
		this.src = src;
		this.size = size;
		this.onClick = onClick;
		this.hideCardsOnClick = hideCardsOnClick;

		/* Create the foreign object */
		this.card = this.canvas.append ("div" )
			.classed ( "card " + position[counter], true )
			.attr ("id", "card-outer " + position[counter]);

		this.cardInner = this.card.append ("div" )
			.classed ( "card-inner " + position[counter], true)
			.attr ("id", "card-inner " + position[counter]);

		this.cardBack = this.cardInner.append("div")
			.classed("card-back " + position[counter], true)
			.attr ( "id", "card-back " + position[counter])
			.attr ( "height", "100%")
			.attr ( "width", "100%");
			
		/* Append the image */
		this.cardImg = this.cardBack.append ( "img" )
			.classed ( "card-img " + position[counter], true )
			.attr ( "id", "card-img "+position[counter])
			.attr ( "src", this.src );

		this.cardFace = this.cardInner.append("div")
			.classed("card-face " + position[counter], true)
			.attr ( "id", "card-face " + position[counter++])
			.attr ( "height", "100%")
			.attr ( "width", "100%");
	}


}