


/**
 * @param {String} target Timestamp of the target to be passed to Date.parse.
 * @param {Object} days D3 selection for the <p> element for days.
 * @param {Object} hours D3 selection for the <p> element for hours.
 * @param {Object} minutes D3 selection for the <p> element for minutes.
 * @param {Object} seconds D3 selection for the <p> element for seconds.
 * @returns {number} The interval which handles the timer.
 */
function setupCountdown ( target, days, hours, minutes, seconds )
{
	/* Parse the date */
	const targetTimestamp = Date.parse ( target );

	/* Create the countdown function */
	const countdown = () =>
	{
		/* Get the time until the target */
		const timeRemaining = Math.max ( targetTimestamp - Date.now (), 0 );

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

	/* Run initially, then set an interval */
	countdown ();
	return setInterval ( countdown, 1000 );
}