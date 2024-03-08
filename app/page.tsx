"use client";

import { useEffect, useRef, useState } from 'react';
import SlidingCard from "/app/lib/slidingCard.tsx";
import styles from "./page.module.css";

export default function Splash() {
	const cardRef = useRef(null);
	const ref = useRef(null);

	const [cardDims, setCardDims] = useState({width: 0, height: 0});

	useEffect(() => {
		if (cardRef.current && (cardRef.current.offsetWidth != cardDims['width'] || cardRef.current.offsetHeight != cardDims['height']))
			setCardDims({width: cardRef.current.offsetWidth, height: cardRef.current.offsetHeight});
	}, [cardRef.current])

	return (
	    <main className={styles.main}>
			<div className={styles.mainCard} ref={cardRef}>
				<SlidingCard ref={ref} cardDims={cardDims}>
					<div>
						<button onClick={() => ref.current.goForward()}>Create Game</button>
					</div>

					<div>
						<button onClick={() => ref.current.goBackward()}>Go Back</button>
					</div>
				</SlidingCard>
			</div>
	    </main>
	);
}


/*


*/
