import type {RequestParameters} from '../util/ajax';

export type PerformanceMetrics = {
    loadTime: number;
    fullLoadTime: number;
    fps: number;
    percentDroppedFrames: number;
    totalFrames: number;
};

export enum PerformanceMarkers {
    create = 'create',
    load = 'load',
    fullLoad = 'fullLoad'
}

let lastFrameTime = null;
let frameTimes = [];

const minFramerateTarget = 60;
const frameTimeTarget = 1000 / minFramerateTarget;

const loadTimeKey = 'loadTime';
const fullLoadTimeKey = 'fullLoadTime';

export const PerformanceUtils = {
    mark(marker: PerformanceMarkers) {
        performance.mark(marker);
    },
    frame(timestamp: number) {
        const currTimestamp = timestamp;
        if (lastFrameTime != null) {
            const frameTime = currTimestamp - lastFrameTime;
            frameTimes.push(frameTime);
        }
        lastFrameTime = currTimestamp;
    },
    clearMetrics() {
        lastFrameTime = null;
        frameTimes = [];
        performance.clearMeasures(loadTimeKey);
        performance.clearMeasures(fullLoadTimeKey);

        for (const marker in PerformanceMarkers) {
            performance.clearMarks(PerformanceMarkers[marker]);
        }
    },

    getPerformanceMetrics(): PerformanceMetrics {
        performance.measure(loadTimeKey, PerformanceMarkers.create, PerformanceMarkers.load);
        performance.measure(fullLoadTimeKey, PerformanceMarkers.create, PerformanceMarkers.fullLoad);
        const loadTime = performance.getEntriesByName(loadTimeKey)[0].duration;
        const fullLoadTime = performance.getEntriesByName(fullLoadTimeKey)[0].duration;
        const totalFrames = frameTimes.length;

        const avgFrameTime = frameTimes.reduce((prev, curr) => prev + curr, 0) / totalFrames / 1000;
        const fps = 1 / avgFrameTime;

        // count frames that missed our framerate target
        const droppedFrames = frameTimes
            .filter((frameTime) => frameTime > frameTimeTarget)
            .reduce((acc, curr) => {
                return acc + (curr -  frameTimeTarget) / frameTimeTarget;
            }, 0);
        const percentDroppedFrames = (droppedFrames / (totalFrames + droppedFrames)) * 100;

        return {
            loadTime,
            fullLoadTime,
            fps,
            percentDroppedFrames,
            totalFrames
        };
    }
};

/**
 * Safe wrapper for the performance resource timing API in web workers with graceful degradation
 *
 * @param {RequestParameters} request
 * @private
 */
export class RequestPerformance {
    _marks: {
        start: string;
        end: string;
        measure: string;
    };

    constructor (request: RequestParameters) {
        this._marks = {
            start: [request.url, 'start'].join('#'),
            end: [request.url, 'end'].join('#'),
            measure: request.url.toString()
        };

        performance.mark(this._marks.start);
    }

    finish() {
        performance.mark(this._marks.end);
        let resourceTimingData = performance.getEntriesByName(this._marks.measure);

        // fallback if web worker implementation of perf.getEntriesByName returns empty
        if (resourceTimingData.length === 0) {
            performance.measure(this._marks.measure, this._marks.start, this._marks.end);
            resourceTimingData = performance.getEntriesByName(this._marks.measure);

            // cleanup
            performance.clearMarks(this._marks.start);
            performance.clearMarks(this._marks.end);
            performance.clearMeasures(this._marks.measure);
        }

        return resourceTimingData;
    }
}

export default performance;
