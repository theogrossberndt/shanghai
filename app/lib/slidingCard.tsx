"use client";

import { Fragment, forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react';
import ChildMeasurer from "./childMeasurer.tsx";
import styles from "./slidingCard.module.css";
import { AnimatePresence, motion } from 'framer-motion';

const SlidingCard = forwardRef((props, ref) => {
	const idStackToIndexStack = ids => {
		let newStack=[];
		ids.forEach(id => {
			props.children.forEach((child, idx) => {
				if (child.props.id == id)
					newStack.push(idx);
			})
		});
		return newStack;
	}

	const [direction, setDirection] = useState<number>(1)
	const [selected, setSelected] = useState<number>(-1);
	const [maxChildDims, setMaxChildDims] = useState<>({width: 0, height: 0});

	const maxChildDimsRef = useRef(null);

	const [stack, setStack] = useState<array<number>>([]);
	console.log(stack);
	maxChildDimsRef.current = maxChildDims;

	useImperativeHandle(ref, () => ({
		currentId() {
			return props.children[selected].props.id;
		},
		setStack(ids, direction = 0) {
			const newStack = idStackToIndexStack(ids);
			console.log("setting stack", newStack);
			setStack(newStack);
			setSelected(newStack[newStack.length-1]);
			setDirection(direction);
		},

		goForward(id){
			let newCurrentI: number = -1;
			props.children.forEach((child, idx) => {
				if (child.props.id == id)
					newCurrentI = idx;
			});
			if (newCurrentI < 0)
				console.error("Attempted to slide forward to unknown child with id: ", id);
			else {
				setStack(stack => ([...stack, newCurrentI]));
				setSelected(newCurrentI);
				setDirection(1);
			}
		},

		goBackward(id){
			let newCurrentI: number = -1;
			if (id != null){
				props.children.forEach((child, idx) => {
					if (child.props.id == id)
						newCurrentI = idx;
				});
				if (newCurrentI < 0)
					console.error("Attempted to slide backward to unknown child with id: ", id);
				else {
					setStack(stack => {
						let newStack = [...stack];
						while (true){
							const el = newStack.pop();
							if (el == undefined || el == newCurrentI)
								break;
						}
						return [...newStack, newCurrentI];
					})
					setSelected(newCurrentI);
					setDirection(-1);
				}
			}
			else {
				newCurrentI = stack[stack.length - 2];
				setStack(stack => {
					let newStack = [...stack];
					newStack.pop();
					return newStack;
				})
				setSelected(newCurrentI);
				setDirection(-1);
			}
		}
	}));

	const setMaxDimsHandler = (childMaxDims) => {
		if (maxChildDimsRef.current.width == 0 || maxChildDimsRef.current.height == 0){
			const newStack = (props.initialStack && props.initialStack.length > 0) ? idStackToIndexStack(props.initialStack) : [0];
			setStack(newStack);
			setSelected(newStack[newStack.length-1]);
			setDirection(0);
		}

		if (childMaxDims.width != maxChildDimsRef.current.width || childMaxDims.height != maxChildDimsRef.current.height)
			setMaxChildDims(childMaxDims);

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
			<ChildMeasurer setMaxDimensions={setMaxDimsHandler}>
				{props.children}
			</ChildMeasurer>
			<AnimatePresence initial={false} custom={direction}>
				{props.children.map((child, idx) => idx == selected && (
					<motion.div key={idx} style={{width: Math.max(maxChildDims.width, props.cardDims.width), height: Math.max(maxChildDims.height, props.cardDims.height), position: 'absolute', padding: '1rem'}}
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
