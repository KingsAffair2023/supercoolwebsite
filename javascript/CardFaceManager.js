
class CardFaceManager
{

	/** @public {Number} The delay between cards flipping */
	static cardFlipDelay = 150;

	/** @public {Number} The duration a card takes to flip */
	static cardFlipDuration = 400;



	/** @private {Object} A D3 selection for the cards */
	_cards;



	/**
	 * @param {Object} cards A D3 selection for the cards
	 *
	 */
	constructor ( cards )
	{
		/* Save the parameters */
		this._cards = cards;
	}



	/**
	 * @description Actually flip the cards.
	 * @param {Number} numFlips The number of cards that should flip
	 * @param {Number} [cardFlipDelay] The delay between cards flipping
	 * @param {Number} [cardFlipDuration] The duration a card takes to flip
	 */
	flip ( numFlips, cardFlipDelay = CardFaceManager.cardFlipDelay, cardFlipDuration = CardFaceManager.cardFlipDuration )
	{
		/* Iterate over the cards */
		this._cards.each ( function ( d, i )
		{
			/* Select the front and back faces */
			const cardInner = d3.select ( this ).select ( ".card-inner" );
			const cardFace = cardInner.select ( ".card-face" );
			const cardBack = cardInner.select ( ".card-back" );

			/* Flip the card */
			if ( i < numFlips )
			{
				cardBack
					.style ( "transition", "transform " + cardFlipDuration + "ms" )
					.style ( "transition-timing-function", "ease" )
					.style ( "transition-delay", ( i * cardFlipDelay ) + "ms" )
					.style ( "transform", "rotateY(180deg)" );
				cardFace
					.style ( "visibility", "visible" )
					.style ( "transition", "transform " + cardFlipDuration + "ms" )
					.style ( "transition-timing-function", "ease" )
					.style ( "transition-delay", i * cardFlipDelay + "ms" )
					.style ( "transform", "rotateY(360deg)" );
			}
			else
			{
				cardFace
					.style ( "transition", "transform " + cardFlipDuration + "ms" )
					.style ( "transition-timing-function", "ease" )
					.style ( "transition-delay", i * cardFlipDelay + "ms" )
					.style ( "transform", "rotateY(180deg)" );
				cardBack
					.style ( "transition", "transform " + cardFlipDuration + "ms" )
					.style ( "transition-timing-function", "ease" )
					.style ( "transition-delay", i * cardFlipDelay + "ms" )
					.style ( "transform", "rotateY(0deg)" );
			}

			/* Set a timeout for when the flip is done */
			setTimeout ( () =>
			{
				/* Class the card */
				cardInner.classed ( "card-inactive", i >= numFlips )
					.classed ( "card-active", i < numFlips );
			},  i * cardFlipDelay + cardFlipDuration );
		} );
	}
}
