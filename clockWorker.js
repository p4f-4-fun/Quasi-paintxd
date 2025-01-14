"use strict";

const getTimeMrClockWorker = () => {
    const actual = (new Date()).toLocaleTimeString();

    postMessage(actual);
    setTimeout(getTimeMrClockWorker, 1000);
};

// Start the worker
getTimeMrClockWorker();


