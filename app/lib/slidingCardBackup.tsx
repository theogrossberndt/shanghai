"use client";

import { forwardRef, useImperativeHandle, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import styles from "./slidingCard.module.css";
import { motion, AnimatePresence } from 'framer-motion';

type SlidingCardProps = {
	currentIndex: number;
	setCurrentIndex: React.SetStateAction<number>
	children: Array<React.ReactNode>;
};

const SlidingCard = forwardRef((props, ref) => {
	const pWidths: Array<number> = props.children.map(child => 0);
	const [widths, setWidths] = useState<Array<number>>(pWidths);
	const [selected, setSelected] = useState<number>(0);

	const scrollParentRef = useRef<HTMLDivElement>(null)

	const onElementChanged = (element: HTMLDivElement | null, idx: number): void => {
		if (element != null && element.offsetWidth != widths[idx])
			setWidths(widths => widths.map((el: number, elI: number): number => (elI == idx ? element.offsetWidth : el)));
	}

	const calculateMaxWidth = (): number => {
		let newMaxWidth: number = 0;
		widths.forEach((width: number): void => {
			if (width > newMaxWidth)
				newMaxWidth = width;
		});
		if (newMaxWidth < props.cardWidth)
			newMaxWidth = props.cardWidth;
		if (scrollParentRef.current != null)
			scrollParentRef.current.scroll({left: selected*newMaxWidth, behavior: "instant"});
		return newMaxWidth;
	};

	const maxWidth: number = useMemo(calculateMaxWidth, [widths, scrollParentRef]);
	console.log(maxWidth);

	const debouncedCallback = useMemo(() => debounce(() => setWidths(pwidths), 300, {leading: true, trailing: false}), [setWidths])

	useEffect(() => {
		window.addEventListener('resize', debouncedCallback);
		return () => {
			window.removeEventListener('resize', debouncedCallback);
			debouncedCallback.cancel();
		};
	}, []);

	useImperativeHandle(ref, () => ({
		goForward(){
			if (selected < props.children.length-1){
				setSelected(selected+1);
				if (scrollParentRef.current != null)
					scrollParentRef.current.scroll({left: (selected+1)*maxWidth, behavior: "smooth"});
			}
		},

		goBackward(){
			if (selected > 0){
				setSelected(selected-1);
				if (scrollParentRef.current != null)
					scrollParentRef.current.scroll({left: (selected-1)*maxWidth, behavior: "smooth"});
			}
		}
	}));

	return (
		<div className={styles.parent} ref={scrollParentRef}>
			{props.children.map((child, idx) => (
				<div key={idx} style={{minWidth: maxWidth}} ref={element => onElementChanged(element, idx)}>
					{child}
				</div>
			))}
		</div>
	);
});

export default SlidingCard;

/*
			<CSSTransition
				className={["side", styles.fillParentG].join(" ")}
				key={currentIndex}
				timeout={1000}
			>
					{child}
			</CSSTransition>
					{state => (
						<div style={{...defaultStyle, ...transitionStyles[state]}} className={styles.fillParent}>
							{child}
						</div>
					)}

*/
