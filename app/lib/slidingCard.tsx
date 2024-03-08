"use client";

import { Fragment, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import ChildMeasurer from "./childMeasurer.tsx";
import styles from "./slidingCard.module.css";
import { AnimatePresence, motion } from 'framer-motion';

const SlidingCard = forwardRef((props, ref) => {
	const [direction, setDirection] = useState<number>(1)
	const [selected, setSelected] = useState<number>(-1);
	const [maxDims, setMaxDims] = useState<>({width: 0, height: 0});

	useImperativeHandle(ref, () => ({
		goForward(id){
			let newCurrentI: number = -1;
			props.children.forEach((child, idx) => {
				if (child.props.id == id)
					newCurrentI = idx;
			});
			if (newCurrentI < 0)
				console.error("Attempted to slide forward to unknown child with id: ", id);
			else {
				setSelected(newCurrentI);
				setDirection(1);
			}
		},

		goBackward(id){
			let newCurrentI: number = -1;
			props.children.forEach((child, idx) => {
				if (child.props.id == id)
					newCurrentI = idx;
			});
			if (newCurrentI < 0)
				console.error("Attempted to slide backward to unknown child with id: ", id);
			else {
				setSelected(newCurrentI);
				setDirection(-1);
			}
		}
	}));

	const setMaxDimsHandler = (childMaxDims) => {
		if (maxDims.width == 0 || maxDims.height == 0){
			setSelected(0);
			setDirection(0);
		}
		let newMaxWidth = Math.max(props.cardDims['width'], childMaxDims['width'], maxDims['width']);
		let newMaxHeight = Math.max(props.cardDims['height'], childMaxDims['height'], maxDims['height']);

		if (newMaxWidth != maxDims['width'] || newMaxHeight != maxDims['height'])
			setMaxDims({width: newMaxWidth, height: newMaxHeight});
	}

	const transition={duration: 1, ease: [0.65, 0, 0.35, 1]};

	const variants = {
		initial: dir => (dir == 0 ? {
			opacity: 0
		} : {
			x: dir > 0 ? "100%" : "-100%"
		}),
		target: {
			opacity: 1,
			x: "0%"
		},
		exit: dir => (dir == 0 ? {
			opacity: 0
		} : {
			x: dir > 0 ? "-100%" : "100%"
		}),
	}

	return (
		<div className={styles.parent}>
			<ChildMeasurer setMaxDimensions={setMaxDimsHandler} show={false}>
				{props.children}
			</ChildMeasurer>
			<AnimatePresence initial={false} custom={direction}>
				{props.children.map((child, idx) => idx == selected && (
					<motion.div key={idx} style={{minWidth: maxDims.width, minHeight: maxDims.height, position: 'absolute'}}
						variants={variants} custom={direction} initial="initial" animate="target" exit="exit" transition={transition}
					>
						{child}
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
});

export default SlidingCard;
