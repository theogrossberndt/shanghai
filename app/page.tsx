"use client";

import { useEffect, useRef, useState } from 'react';
import SlidingCard from "/app/lib/slidingCard.tsx";
import styles from "./page.module.css";

export default function Splash() {
	const cardRef = useRef(null);
	const ref = useRef(null);

	const [cardDims, setCardDims] = useState({width: 0, height: 0});

	useEffect(() => {
		if (cardRef.current && (cardRef.current.offsetWidth != cardDims['width'] || cardRef.current.offsetHeight != cardDims['height'])){
			const cs = getComputedStyle(cardRef.current);
			var paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
			var paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

			var borderX = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
			var borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);

			// Element width and height minus padding and border
			const availWidth = cardRef.current.offsetWidth - paddingX - borderX;
			const availHeight = cardRef.current.offsetHeight - paddingY - borderY;

			setCardDims({width: availWidth, height: availHeight});
		}
	}, [cardRef.current])

	return (
	    <main className={styles.main}>
			<div className={styles.mainCard} ref={cardRef}>
				<SlidingCard ref={ref} cardDims={cardDims}>
					<div id="s1">
						<button onClick={() => ref.current.goForward("s2")}>Create Game</button>
					</div>

					<div id="s2">
						<button onClick={() => ref.current.goForward("s3")}>Go Forward</button><br/>
						<button onClick={() => ref.current.goBackward("s1")}>Go Back</button>
					</div>

					<div id="s3">
						<button onClick={() => ref.current.goBackward("s2")}>Go Back</button>
					</div>
				</SlidingCard>
			</div>
	    </main>
	);
}


/*


*/
