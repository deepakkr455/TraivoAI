import { useEffect, useRef } from 'react';

interface UseVisibilityTrackerProps {
    onVisibleThreshold: () => void;
    thresholdMs?: number;
    intersectionThreshold?: number;
    enabled?: boolean;
}

/**
 * A hook that triggers a callback when an element has been visible for a certain duration.
 * 
 * @param onVisibleThreshold Callback function when threshold is reached
 * @param thresholdMs Duration in milliseconds to wait (default 10000)
 * @param intersectionThreshold Percentage of element visible (0.0 to 1.0, default 0.5)
 * @param enabled Whether tracking is active (default true)
 * @returns A ref to be attached to the element to track
 */
export const useVisibilityTracker = <T extends HTMLElement>({
    onVisibleThreshold,
    thresholdMs = 10000,
    intersectionThreshold = 0.5,
    enabled = true
}: UseVisibilityTrackerProps) => {
    const elementRef = useRef<T>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const hasTriggered = useRef(false);
    const callbackRef = useRef(onVisibleThreshold);

    // Keep callback ref up to date
    useEffect(() => {
        callbackRef.current = onVisibleThreshold;
    }, [onVisibleThreshold]);

    useEffect(() => {
        if (!enabled || hasTriggered.current) return;

        console.log(`[useVisibilityTracker] Initializing observer for element. Threshold: ${thresholdMs}ms`);

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    // Start timer if not already running
                    if (!timerRef.current) {
                        console.log(`[useVisibilityTracker] Element is visible. Starting ${thresholdMs}ms timer...`);
                        timerRef.current = setTimeout(() => {
                            if (!hasTriggered.current) {
                                console.log(`[useVisibilityTracker] Threshold reached! Triggering tracking callback.`);
                                callbackRef.current();
                                hasTriggered.current = true;
                                if (elementRef.current) {
                                    observer.unobserve(elementRef.current);
                                }
                                observer.disconnect();
                            }
                        }, thresholdMs);
                    }
                } else {
                    // Element left view, reset timer
                    if (timerRef.current) {
                        console.log(`[useVisibilityTracker] Element left view. Resetting timer.`);
                        clearTimeout(timerRef.current);
                        timerRef.current = null;
                    }
                }
            },
            { threshold: intersectionThreshold }
        );

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (timerRef.current) {
                console.log(`[useVisibilityTracker] Cleaning up. Clearing timer.`);
                clearTimeout(timerRef.current);
            }
            observer.disconnect();
        };
    }, [thresholdMs, intersectionThreshold, enabled]); // Removed onVisibleThreshold from dependencies

    return elementRef;
};
