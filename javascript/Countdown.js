


/**
 * @param {String} target Timestamp of the target to be passed to Date.parse.
 * @param {Object} days D3 selection for the <p> element for days.
 * @param {Object} hours D3 selection for the <p> element for hours.
 * @param {Object} minutes D3 selection for the <p> element for minutes.
 * @param {Object} seconds D3 selection for the <p> element for seconds.
 * @returns {number|null} The interval which handles the timer, or null if no timer was set.
 */
function setupCountdown ( target, days, hours, minutes, seconds )
{
	/* Parse the date */
	const targetTimestamp = Date.parse ( target );

	/* The countdown interval ID */
	let interval = null;

	/* Create the countdown function */
	const countdown = () =>
	{
		/* Get the time until the target */
		const timeRemaining = Math.max ( targetTimestamp - Date.now (), 0 );

		/* If there is no time remaining, reload the page */
		if ( timeRemaining === 0 && interval )
		{
			clearInterval ( interval );
			setTimeout ( () => location.reload (), 1000 );
			return;
		}

		/* Set the seconds */
		const secondsRemaining = timeRemaining / 1000;
		seconds.text ( ~~secondsRemaining % 60 );

		/* Set the minutes */
		const minutesRemaining = secondsRemaining / 60;
		minutes.text ( ~~minutesRemaining % 60 );

		/* Set the hours */
		const hoursRemaining = minutesRemaining / 60;
		hours.text ( ~~hoursRemaining % 24 );

		/* Set the days */
		const daysRemaining = hoursRemaining / 24;
		days.text ( ~~daysRemaining );
	}

	/* Set up the countdown, and only set an interval if the time has not already passed */
	countdown ();
	if ( targetTimestamp > Date.now () )
		interval = setInterval ( countdown, 1000 );

	/* Return the interval */
	return interval;
}