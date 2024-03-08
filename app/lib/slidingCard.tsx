"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import ChildMeasurer from "./childMeasurer.tsx";
import styles from "./slidingCard.module.css";

const SlidingCard = forwardRef((props, ref) => {
	const scrollParentRef = useRef(null);

	const [selected, setSelected] = useState<number>(0);
	const [maxDims, setMaxDims] = useState<>({width: 0, height: 0});

	useImperativeHandle(ref, () => ({
		goForward(){
			if (selected < props.children.length-1)
				if (scrollParentRef.current != null){
					scrollParentRef.current.scroll({left: (selected+1)*maxDims['width'], behavior: "smooth"});
					setSelected(selected+1);
				}
		},

		goBackward(){
			if (selected > 0)
				if (scrollParentRef.current != null){
					scrollParentRef.current.scroll({left: (selected-1)*maxDims['width'], behavior: "smooth"});
					setSelected(selected-1);
				}
		}
	}));

	const setMaxDimsHandler = (childMaxDims) => {
		let newMaxWidth = Math.max(props.cardDims['width'], childMaxDims['width'], maxDims['width']);
		let newMaxHeight = Math.max(props.cardDims['height'], childMaxDims['height'], maxDims['height']);

		if (scrollParentRef.current != null)
			scrollParentRef.current.scroll({left: selected*newMaxWidth, behavior: "instant"});

		if (newMaxWidth != maxDims['width'] || newMaxHeight != maxDims['height'])
			setMaxDims({width: newMaxWidth, height: newMaxHeight});
	}

	return (
		<div className={styles.parent} ref={scrollParentRef}>
			<ChildMeasurer setMaxDimensions={setMaxDimsHandler}>
				{props.children.map((child, idx) => (
					<div key={idx} style={{minWidth: maxDims['width'], minHeight: maxDims['height']}}>
						{child}
					</div>
				))}
			</ChildMeasurer>
		</div>
	);
});

export default SlidingCard;
