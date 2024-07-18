"use client";

import { Fragment, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ChildMeasurer from "./childMeasurer.tsx";
import styles from "./slidingCard.module.css";
import { AnimatePresence, motion } from 'framer-motion';

const SlidingCard = forwardRef((props, ref) => {
	const cardRef = useRef(null);
	const [direction, setDirection] = useState<number>(1)
	const [selected, setSelected] = useState<number>(-1);
	const [maxDims, setMaxDims] = useState<>({width: 0, height: 0});
	const [cardDims, setCardDims] = useState<>({width: 0, height: 0, paddingX: 0, paddingY: 0});

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

			setCardDims({width: cardRef.current.offsetWidth, height: cardRef.current.offsetHeight, paddingX: paddingX, paddingY: paddingY});

			let newMaxWidth = maxNonZero(availWidth, maxDims.width);
			let newMaxHeight = maxNonZero(availHeight, maxDims.height);
			if (newMaxWidth != maxDims.width || newMaxHeight != maxDims.height)
				setMaxDims(currentMaxDims => ({width: maxNonZero(availWidth, currentMaxDims.width), height: maxNonZero(availHeight, currentMaxDims.height)}));
		}
	}, [cardRef.current])

	const maxNonZero = (...args) => {
		let max = null;
		args.forEach(arg => {
			if ((arg > 0 && max == null) || (arg > 0 && arg > max))
				max = arg;
		});
		return max == null ? 0 : max;
	}

	const setMaxDimsHandler = (childMaxDims) => {
		console.log("childMaxDims:", childMaxDims);
		if (maxDims.width == 0 || maxDims.height == 0){
			setSelected(0);
			setDirection(0);
		}

//		console.log("cdw", cardDims.width, "cmdw", childMaxDims.width, "mdw", maxDims.width);
		let newMaxWidth = maxNonZero(cardDims.width, childMaxDims.width, maxDims.width);
//		console.log("cdh", cardDims.height, "cmdh", childMaxDims.height, "mdh", maxDims.height);
		let newMaxHeight = maxNonZero(cardDims.height, childMaxDims.height, maxDims.height);
//		console.log("nmw: ", newMaxWidth, "nmh: ", newMaxHeight);

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

//	console.log("md: ", maxDims);
//	console.log("cd: ", cardDims);
	console.log(props.recalculate);
//			<div className={[styles.parent, props.className].join(" ")} style={{minHeight: cardDims.paddingY + maxDims.height, minWidth: cardDims.paddingX + maxDims.width}} ref={cardRef}>

	return (
		<Fragment>
			<ChildMeasurer setMaxDimensions={setMaxDimsHandler} show={false} className={props.className}>
				{props.children}
			</ChildMeasurer>
			<div className={[styles.parent, props.className].join(" ")} ref={cardRef}>
				<div className={styles.xClip} style={{minHeight: cardDims.paddingY + maxDims.height, minWidth: cardDims.paddingX + maxDims.width}}>
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
			</div>
		</Fragment>
	);
});

export default SlidingCard;

/*

*/
