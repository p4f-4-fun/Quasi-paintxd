"use strict";

// Initial pause is let user to start an interaction with paint board by mouse clicking on,
// and not instatly just when user start moves his mouse over .paint-container
let isPaintingPaused = true;

// Fetch color from dataset attribute from .color-box element with class .active
// this is initialized pre-chosen color at start of interactions
let activeColor = (() => {
    const activeColorBox = document.querySelector(".color-box.active");

    return activeColorBox.dataset.color;
})();

// Get computed property value directly from stylesheet or from element (but ONLY if is rendered in DOM)
const getComputedPropertyValueFromStylesheet = (
    domElement,
    propertyName,
    isRenderedInDOM
) => {
    if (!propertyName || typeof propertyName !== "string" || !domElement)
        return;

    if (isRenderedInDOM) {
        return domElement && typeof domElement === "object"
            ? window.getComputedStyle(domElement).getPropertyValue(propertyName)
            : domElement && typeof domElement === "string"
            ? window
                  .getComputedStyle(document.querySelector(domElement))
                  .getPropertyValue(propertyName)
            : null; // null because in this case we haven't any more action to do
    } else if (isRenderedInDOM === false) {
        return domElement && typeof domElement === "string"
            ? [...document.styleSheets[0].cssRules]
                  .find((rule) => rule.selectorText === domElement)
                  .style.getPropertyValue(propertyName)
            : null; // null because we can't handle object and ever more we don't have to, if ain't rendered it means Object DOMElement not exist
    } else {
        return;
    }
};

// IIFE function basePaintContainerBgColor is indirectly looking for an :root and his css variables
// when it finds then invoke getPropertyValue method with exact variable name
const basePaintContainerBgColor = (() => {
    return getComputedPropertyValueFromStylesheet(
        ":root",
        "--base-paint-container-bg-color",
        true
    );
})();

const cursorBehaviorHandler = () => {
    const containerElement = document.querySelector(".paint-container");

    isPaintingPaused
        ? containerElement.classList.remove("cursor-paint")
        : containerElement.classList.add("cursor-paint");
};

const pauseResumePainting = () => {
    // Toggle flag pause/ resume
    isPaintingPaused = !isPaintingPaused;

    // Toggle cursor crosshair while paint - better UX
    cursorBehaviorHandler();
};

const paintBlockElementEventsHandler = (element) => {
    if (!element) {
        console.error(
            "paintBlockElementEventsHandler() - element type or consistency problem"
        );
        return;
    }

    element.addEventListener("mouseenter", () => {
        element.style.backgroundColor =
            isPaintingPaused === false && activeColor;
    });
};

const createElement = (elementType, elementClasses) => {
    const element = document.createElement(String(elementType));
    
    if (!elementType || !elementClasses) {
        console.error(
            "Cannot create element in createElement() - elementType or classes are not specified or datatype problem"
        );
        return;
    }

    elementClasses &&
        Array.isArray(elementClasses) &&
        elementClasses.forEach((elementClass) =>
            element.classList.add(String(elementClass))
        );

    return element;
};

const createPaintBoard = () => {
    const containerElement = document.querySelector(".paint-container");

    const elementWidth = parseInt(
        getComputedPropertyValueFromStylesheet(containerElement, "width", true)
    );

    const elementHeight = parseInt(
        getComputedPropertyValueFromStylesheet(containerElement, "height", true)
    );

    const blockEntityElementSize = parseInt(
        getComputedPropertyValueFromStylesheet(".block", "height", false)
    );

    if (!elementWidth || !elementHeight || !blockEntityElementSize) {
        console.error(
            "Cannot create paint board in createPaintBoard() - element width/ height or blockEntityElement size are not set, fetching problem from getComputedPropertyValueFromStylesheet() function"
        );
        return;
    }

    const howManyBlocks =
        (elementWidth * elementHeight) / Math.pow(blockEntityElementSize, 2);

    for (let i = 0; i < howManyBlocks; i++) {
        const blockElement = createElement("div", ["block"]);

        // adding proper events listener
        paintBlockElementEventsHandler(blockElement);

        containerElement.append(blockElement);
    }
};

const initDatasetOpacityBaseToPaintContainer = () => {
    const containerElement = document.querySelector(".paint-container");

    containerElement.dataset.opacityBase = parseFloat(
        getComputedPropertyValueFromStylesheet(
            containerElement,
            "opacity",
            true
        )
    );
};

const animatedResetPaintBoard = () => {
    const blockElements = document.querySelectorAll(".block");
    const containerElement = document.querySelector(".paint-container");

    const opacityBase = parseFloat(containerElement.dataset.opacityBase);
    const opacityFadeDuration = 35; // ms
    const opacityStep = 0.2;

    // Firstly - reset block elements to base .paint-container color
    blockElements.forEach((blockElement) => {
        blockElement.style.backgroundColor = basePaintContainerBgColor;
    });

    // Secondly - just animate for UX only
    /**
     * Animations @fadeOut and @fadeIn
     * @fadeOut opacityBase -> 0
     * @fadeIn  0 -> opacityBase
     */
    // Animation @fadeOut
    const animationfadeOutInterval = setInterval(() => {
        const currentOpacity = parseFloat(
            getComputedPropertyValueFromStylesheet(
                containerElement,
                "opacity",
                true
            )
        );

        // We test (currentOpacity !== 0) to prevent error and return when the currentOpacity will equal 0,
        // because this ain't bad value, and moreover this is our goal in this opacity animation
        if (!currentOpacity && currentOpacity !== 0) {
            clearInterval(animationfadeOutInterval);

            console.error(
                "Error in animatedResetPaintBoard(), currentOpacity fetching failure!"
            );
            return;
        }

        if (currentOpacity > 0) {
            containerElement.style.opacity = String(
                currentOpacity - opacityStep
            );
        }

        if (currentOpacity === 0) {
            clearInterval(animationfadeOutInterval);

            // Then...
            // Animation @fadeIn
            const animationfadeInInterval = setInterval(() => {
                const currentOpacity = parseFloat(
                    getComputedPropertyValueFromStylesheet(
                        containerElement,
                        "opacity",
                        true
                    )
                );

                if (!currentOpacity && currentOpacity !== 0) {
                    clearInterval(animationfadeInInterval);

                    console.error(
                        "Error in animatedResetPaintBoard(), currentOpacity fetching failure!"
                    );
                    return;
                }

                if (currentOpacity < opacityBase) {
                    containerElement.style.opacity = String(
                        currentOpacity + opacityStep
                    );
                }

                if (currentOpacity === opacityBase)
                    clearInterval(animationfadeInInterval);
            }, opacityFadeDuration);
        }
    }, (opacityFadeDuration / 2));
};

const resetPaintBoard = () => {
    // Pause painting until user start paint by just cliking on .paint-container
    isPaintingPaused = true;

    // Toggle cursor style back to pointer giving user feedback that needs to click
    // on the paint container to resume painting after color changed
    cursorBehaviorHandler();

    // Toggle animate-style reset the paint board
    animatedResetPaintBoard();
};

const bindEvents = () => {
    const colorBoxElements = document.querySelectorAll(".color-box");
    const containerElement = document.querySelector(".paint-container");
    const resetPaintBoardElement = document.querySelector(".paint-reset");

    // Event click on .color-box elements - paint color picker
    colorBoxElements.forEach((element) => {
        element.addEventListener("click", () => {
            // Pause painting until user start paint by just cliking on .paint-container
            // to avoid unexpected painting in places user doesn't want to
            isPaintingPaused = true;

            // Toggle cursor style back to pointer giving user feedback that needs to click
            // on the .paint-container to resume painting after color changed
            cursorBehaviorHandler();

            activeColor = element.dataset.color;

            // Yes, we can also query exact element with class .active directly and then just remove him that class,
            // but for integral security purpose we loop through the elements (there is only few so.. doesn't matter)
            // and then remove from all of them and now we know none of .color-box elements got this class
            colorBoxElements.forEach((element) => {
                element.classList.remove("active");
            });

            element.classList.add("active");
        });
    });

    // Event click on .paint-reset element - reset paint board
    resetPaintBoardElement.addEventListener("click", resetPaintBoard);

    // Event click on .paint-container element - pause/ resume painting functionality
    containerElement.addEventListener("click", pauseResumePainting);
};

const initClockWorker = () => {
    const clockElement = document.querySelector(".animated-clock");
    const clockWorker = new Worker("./clockWorker.js");

    clockWorker.addEventListener("message", (Event) => {
        if (!Event.data || typeof Event.data !== "string") {
            clockElement.ariaHidden = true;
            
            console.error("Error in initClockbWorker(), received event data is not string");
            return;
        }

        clockElement.textContent = Event.data;
        clockElement.ariaDescription = `Actual time is ${Event.data}`;
    });
};

const init = () => {
    createPaintBoard();

    // Initialize dataset with base opacity to
    // .paint-container - required automatization usable later in animatedResetPaintBoard
    // Invoke this function before bindEvents to prevent of unexepected click event on .reset-paint element
    // when the opacity dataset function handler was not initialized
    initDatasetOpacityBaseToPaintContainer();

    // Invoke events binding
    bindEvents();

    // Init clock web worker
    initClockWorker();
};

window.onload = init();
