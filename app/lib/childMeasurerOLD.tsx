"use client";

import { Fragment, forwardRef, useImperativeHandle, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import styles from "./slidingCard.module.css";
import { motion, AnimatePresence } from 'framer-motion';

type ChildMeasurerProps = {
	setMaxDimensions: React.SetStateAction;
	children: Array<React.ReactNode>;
	show: boolean;
};

const ChildMeasurer = ({setMaxDimensions, children, show}: ChildMeasurerProps) => {
	const [maxDims, setMaxDims] = useState({width: 0, height: 0});

	const onElementChanged = (element: HTMLDivElement | null, idx: number): void => {
		if (element != null && (element.offsetWidth > maxDims['width'] || element.offsetHeight > maxDims['height'])){
			const newMaxDims = {width: Math.max(element.offsetWidth, maxDims['width']), height: Math.max(element.offsetHeight, maxDims['height'])};
			setMaxDimensions(newMaxDims);
			setMaxDims(newMaxDims);
		}
	}

	const debouncedCallback = useMemo(() => debounce(() => setMaxDims({width: 0, height: 0}), 300, {leading: true, trailing: false}), [setDims])

	useEffect(() => {
		window.addEventListener('resize', debouncedCallback);
		return () => {
			window.removeEventListener('resize', debouncedCallback);
			debouncedCallback.cancel();
		};
	}, []);

	return (
		<Fragment>
			{children.map((child, idx) => (
				<div key={idx} ref={element => onElementChanged(element, idx)} style={{...{
					opacity: (maxDims['width'] <= 0 || maxDims['height'] <= 0 || !show) ? 0 : 1,
					transition: "opacity 500ms"
				}, ...(show ? {} : {position: 'absolute'})}}>
					{child}
				</div>
			))}
		</Fragment>
	);
};

export default ChildMeasurer;
