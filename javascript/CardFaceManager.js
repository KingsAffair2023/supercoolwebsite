
class CardFaceManager
{

	/** @public {Number} The delay between cards flipping */
	static cardFlipDelay = 100;

	/** @public {Number} The duration a card takes to flip */
	static cardFlipDuration = 400;

	static position = [ "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth" ];



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

			/* Animate them flipping */
			if ( i < numFlips )
			{
				/* Fetch the contents */
				fetch ( "/faces/" + CardFaceManager.position [ i ] + ".html" )
					.then ( r => r.text () )
					.then ( c => cardFace.html ( c ) );

				/* Flip the card */
				cardBack
					.style ( "transition", "transform " + ( cardFlipDuration / 2 ) + "ms" )
					.style ( "transition-timing-function", "ease-in" )
					.style ( "transition-delay", ( i * cardFlipDelay ) + "ms" )
					.style ( "transform", "rotateY(90deg)" );
				cardFace
					.style ( "transition", "transform " + ( cardFlipDuration / 2 ) + "ms" )
					.style ( "transition-timing-function", "ease-out" )
					.style ( "transition-delay", ( i * cardFlipDelay + cardFlipDuration / 2 ) + "ms" )
					.style ( "transform", "rotateY(360deg)" );

				/* Set a timeout for when the flip is done */
				setTimeout ( () =>
				{
					/* Class the card */
					cardFace.classed ( "card-active", true )
						.classed ( "card-inactive", false );
				},  i * cardFlipDelay + cardFlipDuration );
			}
			else
			{
				/* Flip the card */
				cardFace
					.style ( "transition", "transform " + ( cardFlipDuration / 2 ) + "ms" )
					.style ( "transition-timing-function", "ease-out" )
					.style ( "transition-delay", ( i * cardFlipDelay ) + "ms" )
					.style ( "transform", "rotateY(270deg)" );
				cardBack
					.style ( "transition", "transform " + ( cardFlipDuration / 2 ) + "ms" )
					.style ( "transition-timing-function", "ease-in" )
					.style ( "transition-delay", ( i * cardFlipDelay + cardFlipDuration / 2 ) + "ms" )
					.style ( "transform", "rotateY(0deg)" );

				/* Set a timeout for when the flip is done */
				setTimeout ( () =>
				{
					/* Class the card */
					cardFace.classed ( "card-inactive", true )
						.classed ( "card-active", false );
				},  i * cardFlipDelay + cardFlipDuration );
			}
		} );
	}
}
