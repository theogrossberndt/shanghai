"use client";

import { Fragment, forwardRef, useImperativeHandle, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { motion, AnimatePresence } from 'framer-motion';

type ChildMeasurerProps = {
	setMaxDimensions: React.SetStateAction;
	children: Array<React.ReactNode>;
	show: boolean;
	className: string;
};

const ChildMeasurer = ({setMaxDimensions, children, show, className}: ChildMeasurerProps) => {
	const childRef = useRef([]);

	const measureChildren = () => {
		let maxHeight = 0;
		let maxWidth = 0;
		childRef.current.forEach(child => {
			const cs = getComputedStyle(child);
			var paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
			var paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

			var borderX = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
			var borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);

			// Element width and height minus padding and border
			maxWidth = Math.max(maxWidth, child.offsetWidth - paddingX - borderX);
			maxHeight = Math.max(maxHeight, child.offsetHeight - paddingY - borderY);
		});
		setMaxDimensions({width: maxWidth, height: maxHeight});
	}

	useEffect(measureChildren, [childRef.current]);

	const debouncedCallback = useMemo(() => debounce(measureChildren, 300, {leading: true, trailing: true}), [childRef.current]);

	useEffect(() => {
		window.addEventListener('resize', debouncedCallback);
		return () => {
			window.removeEventListener('resize', debouncedCallback);
			debouncedCallback.cancel();
		};
	}, []);

	const effChildren = children.map ? children : [children];

	return (
		<Fragment>
			{effChildren.map((child, idx) => (
				<div key={idx} ref={el => {
					childRef.current[idx] = el;
				}} className={className} style={{position: 'absolute', opacity: 0}}>
						{child}
				</div>
			))}
		</Fragment>
	);
};

export default ChildMeasurer;
