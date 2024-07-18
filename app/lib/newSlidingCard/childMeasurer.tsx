"use client";

import { Fragment, forwardRef, useCallback, useImperativeHandle, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import styles from "./slidingCard.module.css";
import { motion, AnimatePresence } from 'framer-motion';

type ChildMeasurerProps = {
	setMaxDimensions: React.SetStateAction;
	children: Array<React.ReactNode>;
	show: boolean;
	className: string;
	recalculate: boolean;
};

const ChildMeasurer = ({setMaxDimensions, children, show, className, recalculate}: ChildMeasurerProps) => {
//	const initDimsArr = children.map(c => ({width: 0, height: 0}));
	const childRef = useRef([]);
//	const [childDims, setChildDims] = useState<Array>(initDimsArr);
	const [maxDims, setMaxDims] = useState<>({width: 0, height: 0});

	const measureChildren = () => {
		let maxHeight = 0;
		let maxWidth = 0;
		childRef.current.forEach(child => {
			try {
				const cs = getComputedStyle(child);
				var paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
				var paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

				var borderX = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
				var borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);

			// Element width and height minus padding and border
				maxWidth = Math.max(maxWidth, child.offsetWidth - paddingX - borderX);
				maxHeight = Math.max(maxHeight, child.offsetHeight - paddingY - borderY);
//				console.log("Measuring child: ", child.offsetWidth, child.offsetHeight);
//				if (childDims[idx].width != child.offsetWidth || childDims[idx].height != child.offsetHeight)
//					setChildDims(childDims.map((dims, cIdx) => cIdx == idx ? {width: child.offsetWidth, height: child.offsetHeight} : dims));
			} catch (error){
//				console.log(error);
//				console.log(child);
			}
		});
		if (maxHeight != 0 && maxWidth != 0 && (maxDims.height != maxHeight || maxDims.width != maxWidth)){
			setMaxDims({width: maxWidth, height: maxHeight});
			setMaxDimensions({width: maxWidth, height: maxHeight});
		}
	}

	useEffect(measureChildren, [children, recalculate]);

//	useEffect(() => {
//		let maxHeight = null;
//		let maxWidth = null;
//		childDims.forEach(child => {
//			maxHeight = maxHeight == null ? child.height : Math.max(maxHeight, child.height);
//			maxWidth = maxWidth == null ? child.width : Math.max(maxWidth, child.width);
//		})
//		const newMaxDims = {width: maxWidth, height: maxHeight};
//		console.log("Max is", maxWidth, maxHeight);
//		console.log(childDims);
//		if (maxHeight != null && maxWidth != null && (maxHeight != maxDims.height || maxWidth != maxDims.width)){
//			setMaxDimensions(newMaxDims);
//			setMaxDims(newMaxDims);
//		}
//	}, [childDims]);

//	const debouncedCallback = useMemo(() => debounce(measureChildren, 300, {leading: true, trailing: false}), [childRef.current]);

//	useEffect(() => {
//		window.addEventListener('resize', debouncedCallback);
//		return () => {
//			window.removeEventListener('resize', debouncedCallback);
//			debouncedCallback.cancel();
//		};
//	}, []);

	const effChildren = children.map ? children : [children];

	return (
		<Fragment>
			{effChildren.map((child, idx) => (
				<div key={idx} className={className} style={show ? {} : {position: 'absolute', opacity: 0}}>
					<div ref={el => {childRef.current[idx] = el;}} style={{position: 'relative'}}>
						{child}
					</div>
				</div>
			))}
		</Fragment>
	);
};

export default ChildMeasurer;
