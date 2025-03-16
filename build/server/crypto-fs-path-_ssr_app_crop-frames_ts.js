/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "(ssr)/./app/crop-frames.ts":
/*!****************************!*\
  !*** ./app/crop-frames.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @techstark/opencv-js */ \"(ssr)/./node_modules/@techstark/opencv-js/dist/opencv.js\");\n/* harmony import */ var _techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0__);\n\nvar templateImage = null;\n/** Crop an image according to the bounds of Frame */ function cropFromFrame(frame, image) {\n    return image.roi({\n        x: frame.x,\n        y: frame.y,\n        width: frame.width,\n        height: frame.height\n    });\n}\nfunction locateNextFrame(image, currFrame, frameSpacingWidth, frameSpacingHeight, grid, templateImage, searchSizeFraction = 0.25) {\n    if (currFrame.row === grid.nRows - 1 && currFrame.col === grid.nCols - 1) {\n        throw new Error(\"Reached the last frame.\");\n    }\n    // Copy the current frame as a starting point for the next frame\n    let nextFrame = {\n        ...currFrame\n    };\n    // Update the row/col coordinate/number if applicable\n    // If last column, increment row number and coordinate and reset\n    // column number and coordinate back to beginning of the row.\n    if (currFrame.col === grid.nCols - 1) {\n        nextFrame.row += 1;\n        nextFrame.y += currFrame.height + frameSpacingHeight;\n        // reset column coordinate and number\n        nextFrame.col = 0;\n        nextFrame.x -= currFrame.width * (grid.nCols - 1) + frameSpacingWidth * (grid.nCols - 1);\n    } else {\n        nextFrame.col += 1;\n        nextFrame.x += currFrame.width + frameSpacingWidth;\n    }\n    if (!(0 <= nextFrame.y && nextFrame.y < image.rows) || !(0 <= nextFrame.y + nextFrame.height && nextFrame.y + nextFrame.height < image.rows)) {\n        throw new Error(`Frame row coordinate ${nextFrame.y} exceeds image height ${image.rows}`);\n    }\n    if (!(0 <= nextFrame.x && nextFrame.x < image.cols) || !(0 <= nextFrame.x + nextFrame.width && nextFrame.x + nextFrame.width < image.cols)) {\n        throw new Error(`Frame col coordinate ${nextFrame.x} exceeds image width ${image.cols}`);\n    }\n    const adjustedFrame = adjustFramePosition(nextFrame, image, templateImage, searchSizeFraction);\n    return adjustedFrame;\n}\nfunction adjustFramePosition(frame, image, templateImage, searchSizeFraction) {\n    const searchSizeWidth = Math.round(searchSizeFraction * frame.width);\n    const searchSizeHeight = Math.round(searchSizeFraction * frame.height);\n    const ymin = Math.max(0, frame.y - searchSizeHeight);\n    const ymax = Math.min(image.rows - 1, frame.y + frame.height + searchSizeHeight);\n    const xmin = Math.max(0, frame.x - searchSizeWidth);\n    const xmax = Math.min(image.cols - 1, frame.x + frame.width + searchSizeWidth);\n    // Cropped portion of the image to search for location of new frame\n    const searchImage = image.roi({\n        x: xmin,\n        y: ymin,\n        width: xmax - xmin,\n        height: ymax - ymin\n    });\n    let result = new (_techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().Mat)(searchImage.rows - templateImage.rows + 1, searchImage.cols - templateImage.cols + 1, (_techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().CV_32FC1));\n    _techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().matchTemplate(searchImage, templateImage, result, (_techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().TM_CCOEFF_NORMED));\n    // @ts-ignore\n    let minMax = _techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().minMaxLoc(result);\n    // deallocate memory from intermediate matrices\n    searchImage.delete();\n    result.delete();\n    return {\n        ...frame,\n        x: minMax.maxLoc.x + xmin,\n        y: minMax.maxLoc.y + ymin\n    };\n}\nfunction cropFramesFromImage(image, firstFrame, frameSpacingWidth, frameSpacingHeight, grid, searchSizeFraction = 0.25, nLagFrames = 16, templateImage = null) {\n    if (nLagFrames <= 0) {\n        throw new Error(`nLagFrames=${nLagFrames} must be greater than 0`);\n    }\n    let currFrame = {\n        ...firstFrame\n    };\n    if (templateImage === null) {\n        templateImage = cropFromFrame(firstFrame, image);\n    } else {\n        // Only needed when handling sheets (images) beyond\n        currFrame = adjustFramePosition(currFrame, image, templateImage, // The initial frame adjustment should use a larger search\n        // space to account for the fact that there could be movement\n        // in the overall grid position between frames.\n        1.5 * searchSizeFraction);\n    }\n    let frames = [\n        currFrame\n    ];\n    while(!(currFrame.row === grid.nRows - 1 && currFrame.col === grid.nCols - 1)){\n        const msg = {\n            type: \"newFrame\",\n            frame: currFrame\n        };\n        postMessage(msg);\n        const nextFrame = locateNextFrame(image, currFrame, frameSpacingWidth, frameSpacingHeight, grid, templateImage);\n        // Keep only the last nLagFrames\n        frames.push(nextFrame);\n        if (frames.length > nLagFrames) {\n            frames = frames.slice(1);\n        }\n        let meanImage = new (_techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().Mat)(templateImage.rows, templateImage.cols, templateImage.type(), [\n            0,\n            0,\n            0,\n            0\n        ]);\n        for (const frame of frames.slice(0, 1)){\n            const frameMat = cropFromFrame(frame, image);\n            _techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().addWeighted(meanImage, 1, frameMat, 1 / frames.length, 0, meanImage);\n            frameMat.delete();\n        }\n        // deallocate the previous template image before assigning the new one\n        templateImage.delete();\n        templateImage = meanImage;\n        currFrame = nextFrame;\n    }\n    const msg = {\n        type: \"newFrame\",\n        frame: currFrame\n    };\n    postMessage(msg);\n    const endMsg = {\n        type: \"sheetEnd\"\n    };\n    postMessage(endMsg);\n    return templateImage;\n}\n(_techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().onRuntimeInitialized) = ()=>{\n    onmessage = (e)=>{\n        const { imageData, firstFrame, frameSpacingBox, gridDimensions } = e.data;\n        try {\n            const imageMat = _techstark_opencv_js__WEBPACK_IMPORTED_MODULE_0___default().matFromImageData(imageData);\n            const frameSpacingHeight = frameSpacingBox.height - 2 * firstFrame.height;\n            const frameSpacingWidth = frameSpacingBox.width - 2 * firstFrame.width;\n            // This is a bit hacky. templateImage is global state\n            // so that it persists betweeen detections for adjacent\n            // sheets. An alternative would be to post the template\n            // image on the \"sheet end\" message. But cv.Mat isn't\n            // serializable.\n            if (firstFrame.sheet == 0 && templateImage !== null) {\n                templateImage.deallocate;\n                templateImage = null;\n            }\n            // assign to templateImage so that it is used on the next sheet\n            const newTemplateImage = cropFramesFromImage(imageMat, firstFrame, frameSpacingWidth, frameSpacingHeight, gridDimensions, 0.25, 16, templateImage);\n            // deallocate old template image and assign the new one\n            templateImage = newTemplateImage;\n        } catch (err) {\n            console.trace();\n            const errMsg = {\n                type: \"error\",\n                error: err.stack\n            };\n            postMessage(errMsg);\n        }\n    };\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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cz83N2IyIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjdiBmcm9tIFwiQHRlY2hzdGFyay9vcGVuY3YtanNcIjtcblxuaW1wb3J0IHR5cGUgeyBCb3gsIEZyYW1lLCBHcmlkLCBXb3JrZXJNZXNzYWdlIH0gZnJvbSBcIkAvYXBwL3R5cGVzXCI7XG5cbnZhciB0ZW1wbGF0ZUltYWdlOiBjdi5NYXQgfCBudWxsID0gbnVsbDtcblxuLyoqIENyb3AgYW4gaW1hZ2UgYWNjb3JkaW5nIHRvIHRoZSBib3VuZHMgb2YgRnJhbWUgKi9cbmZ1bmN0aW9uIGNyb3BGcm9tRnJhbWUoZnJhbWU6IEZyYW1lLCBpbWFnZTogY3YuTWF0KTogY3YuTWF0IHtcbiAgcmV0dXJuIGltYWdlLnJvaSh7XG4gICAgeDogZnJhbWUueCxcbiAgICB5OiBmcmFtZS55LFxuICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICBoZWlnaHQ6IGZyYW1lLmhlaWdodCxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvY2F0ZU5leHRGcmFtZShcbiAgaW1hZ2U6IGN2Lk1hdCxcbiAgY3VyckZyYW1lOiBGcmFtZSxcbiAgZnJhbWVTcGFjaW5nV2lkdGg6IG51bWJlcixcbiAgZnJhbWVTcGFjaW5nSGVpZ2h0OiBudW1iZXIsXG4gIGdyaWQ6IEdyaWQsXG4gIHRlbXBsYXRlSW1hZ2U6IGN2Lk1hdCxcbiAgc2VhcmNoU2l6ZUZyYWN0aW9uOiBudW1iZXIgPSAwLjI1XG4pOiBGcmFtZSB7XG4gIGlmIChjdXJyRnJhbWUucm93ID09PSBncmlkLm5Sb3dzIC0gMSAmJiBjdXJyRnJhbWUuY29sID09PSBncmlkLm5Db2xzIC0gMSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlJlYWNoZWQgdGhlIGxhc3QgZnJhbWUuXCIpO1xuICB9XG5cbiAgLy8gQ29weSB0aGUgY3VycmVudCBmcmFtZSBhcyBhIHN0YXJ0aW5nIHBvaW50IGZvciB0aGUgbmV4dCBmcmFtZVxuICBsZXQgbmV4dEZyYW1lID0geyAuLi5jdXJyRnJhbWUgfTtcblxuICAvLyBVcGRhdGUgdGhlIHJvdy9jb2wgY29vcmRpbmF0ZS9udW1iZXIgaWYgYXBwbGljYWJsZVxuXG4gIC8vIElmIGxhc3QgY29sdW1uLCBpbmNyZW1lbnQgcm93IG51bWJlciBhbmQgY29vcmRpbmF0ZSBhbmQgcmVzZXRcbiAgLy8gY29sdW1uIG51bWJlciBhbmQgY29vcmRpbmF0ZSBiYWNrIHRvIGJlZ2lubmluZyBvZiB0aGUgcm93LlxuICBpZiAoY3VyckZyYW1lLmNvbCA9PT0gZ3JpZC5uQ29scyAtIDEpIHtcbiAgICBuZXh0RnJhbWUucm93ICs9IDE7XG4gICAgbmV4dEZyYW1lLnkgKz0gY3VyckZyYW1lLmhlaWdodCArIGZyYW1lU3BhY2luZ0hlaWdodDtcbiAgICAvLyByZXNldCBjb2x1bW4gY29vcmRpbmF0ZSBhbmQgbnVtYmVyXG4gICAgbmV4dEZyYW1lLmNvbCA9IDA7XG4gICAgbmV4dEZyYW1lLnggLT1cbiAgICAgIGN1cnJGcmFtZS53aWR0aCAqIChncmlkLm5Db2xzIC0gMSkgKyBmcmFtZVNwYWNpbmdXaWR0aCAqIChncmlkLm5Db2xzIC0gMSk7XG4gIH0gZWxzZSB7XG4gICAgbmV4dEZyYW1lLmNvbCArPSAxO1xuICAgIG5leHRGcmFtZS54ICs9IGN1cnJGcmFtZS53aWR0aCArIGZyYW1lU3BhY2luZ1dpZHRoO1xuICB9XG5cbiAgaWYgKFxuICAgICEoMCA8PSBuZXh0RnJhbWUueSAmJiBuZXh0RnJhbWUueSA8IGltYWdlLnJvd3MpIHx8XG4gICAgIShcbiAgICAgIDAgPD0gbmV4dEZyYW1lLnkgKyBuZXh0RnJhbWUuaGVpZ2h0ICYmXG4gICAgICBuZXh0RnJhbWUueSArIG5leHRGcmFtZS5oZWlnaHQgPCBpbWFnZS5yb3dzXG4gICAgKVxuICApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRnJhbWUgcm93IGNvb3JkaW5hdGUgJHtuZXh0RnJhbWUueX0gZXhjZWVkcyBpbWFnZSBoZWlnaHQgJHtpbWFnZS5yb3dzfWBcbiAgICApO1xuICB9XG5cbiAgaWYgKFxuICAgICEoMCA8PSBuZXh0RnJhbWUueCAmJiBuZXh0RnJhbWUueCA8IGltYWdlLmNvbHMpIHx8XG4gICAgIShcbiAgICAgIDAgPD0gbmV4dEZyYW1lLnggKyBuZXh0RnJhbWUud2lkdGggJiZcbiAgICAgIG5leHRGcmFtZS54ICsgbmV4dEZyYW1lLndpZHRoIDwgaW1hZ2UuY29sc1xuICAgIClcbiAgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEZyYW1lIGNvbCBjb29yZGluYXRlICR7bmV4dEZyYW1lLnh9IGV4Y2VlZHMgaW1hZ2Ugd2lkdGggJHtpbWFnZS5jb2xzfWBcbiAgICApO1xuICB9XG5cbiAgY29uc3QgYWRqdXN0ZWRGcmFtZSA9IGFkanVzdEZyYW1lUG9zaXRpb24oXG4gICAgbmV4dEZyYW1lLFxuICAgIGltYWdlLFxuICAgIHRlbXBsYXRlSW1hZ2UsXG4gICAgc2VhcmNoU2l6ZUZyYWN0aW9uXG4gICk7XG5cbiAgcmV0dXJuIGFkanVzdGVkRnJhbWU7XG59XG5cbmZ1bmN0aW9uIGFkanVzdEZyYW1lUG9zaXRpb24oXG4gIGZyYW1lOiBGcmFtZSxcbiAgaW1hZ2U6IGN2Lk1hdCxcbiAgdGVtcGxhdGVJbWFnZTogY3YuTWF0LFxuICBzZWFyY2hTaXplRnJhY3Rpb246IG51bWJlclxuKTogRnJhbWUge1xuICBjb25zdCBzZWFyY2hTaXplV2lkdGggPSBNYXRoLnJvdW5kKHNlYXJjaFNpemVGcmFjdGlvbiAqIGZyYW1lLndpZHRoKTtcbiAgY29uc3Qgc2VhcmNoU2l6ZUhlaWdodCA9IE1hdGgucm91bmQoc2VhcmNoU2l6ZUZyYWN0aW9uICogZnJhbWUuaGVpZ2h0KTtcblxuICBjb25zdCB5bWluID0gTWF0aC5tYXgoMCwgZnJhbWUueSAtIHNlYXJjaFNpemVIZWlnaHQpO1xuICBjb25zdCB5bWF4ID0gTWF0aC5taW4oXG4gICAgaW1hZ2Uucm93cyAtIDEsXG4gICAgZnJhbWUueSArIGZyYW1lLmhlaWdodCArIHNlYXJjaFNpemVIZWlnaHRcbiAgKTtcbiAgY29uc3QgeG1pbiA9IE1hdGgubWF4KDAsIGZyYW1lLnggLSBzZWFyY2hTaXplV2lkdGgpO1xuICBjb25zdCB4bWF4ID0gTWF0aC5taW4oXG4gICAgaW1hZ2UuY29scyAtIDEsXG4gICAgZnJhbWUueCArIGZyYW1lLndpZHRoICsgc2VhcmNoU2l6ZVdpZHRoXG4gICk7XG5cbiAgLy8gQ3JvcHBlZCBwb3J0aW9uIG9mIHRoZSBpbWFnZSB0byBzZWFyY2ggZm9yIGxvY2F0aW9uIG9mIG5ldyBmcmFtZVxuICBjb25zdCBzZWFyY2hJbWFnZSA9IGltYWdlLnJvaSh7XG4gICAgeDogeG1pbixcbiAgICB5OiB5bWluLFxuICAgIHdpZHRoOiB4bWF4IC0geG1pbixcbiAgICBoZWlnaHQ6IHltYXggLSB5bWluLFxuICB9KTtcblxuICBsZXQgcmVzdWx0ID0gbmV3IGN2Lk1hdChcbiAgICBzZWFyY2hJbWFnZS5yb3dzIC0gdGVtcGxhdGVJbWFnZS5yb3dzICsgMSxcbiAgICBzZWFyY2hJbWFnZS5jb2xzIC0gdGVtcGxhdGVJbWFnZS5jb2xzICsgMSxcbiAgICBjdi5DVl8zMkZDMVxuICApO1xuXG4gIGN2Lm1hdGNoVGVtcGxhdGUoc2VhcmNoSW1hZ2UsIHRlbXBsYXRlSW1hZ2UsIHJlc3VsdCwgY3YuVE1fQ0NPRUZGX05PUk1FRCk7XG4gIC8vIEB0cy1pZ25vcmVcbiAgbGV0IG1pbk1heCA9IGN2Lm1pbk1heExvYyhyZXN1bHQpO1xuXG4gIC8vIGRlYWxsb2NhdGUgbWVtb3J5IGZyb20gaW50ZXJtZWRpYXRlIG1hdHJpY2VzXG4gIHNlYXJjaEltYWdlLmRlbGV0ZSgpXG4gIHJlc3VsdC5kZWxldGUoKVxuXG4gIHJldHVybiB7IC4uLmZyYW1lLCB4OiBtaW5NYXgubWF4TG9jLnggKyB4bWluLCB5OiBtaW5NYXgubWF4TG9jLnkgKyB5bWluIH07XG59XG5cbmZ1bmN0aW9uIGNyb3BGcmFtZXNGcm9tSW1hZ2UoXG4gIGltYWdlOiBjdi5NYXQsXG4gIGZpcnN0RnJhbWU6IEZyYW1lLFxuICBmcmFtZVNwYWNpbmdXaWR0aDogbnVtYmVyLFxuICBmcmFtZVNwYWNpbmdIZWlnaHQ6IG51bWJlcixcbiAgZ3JpZDogR3JpZCxcbiAgc2VhcmNoU2l6ZUZyYWN0aW9uOiBudW1iZXIgPSAwLjI1LFxuICBuTGFnRnJhbWVzOiBudW1iZXIgPSAxNixcbiAgdGVtcGxhdGVJbWFnZTogY3YuTWF0IHwgbnVsbCA9IG51bGxcbik6IGN2Lk1hdCB7XG4gIGlmIChuTGFnRnJhbWVzIDw9IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG5MYWdGcmFtZXM9JHtuTGFnRnJhbWVzfSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwYCk7XG4gIH1cblxuICBsZXQgY3VyckZyYW1lID0geyAuLi5maXJzdEZyYW1lIH07XG5cbiAgaWYgKHRlbXBsYXRlSW1hZ2UgPT09IG51bGwpIHtcbiAgICB0ZW1wbGF0ZUltYWdlID0gY3JvcEZyb21GcmFtZShmaXJzdEZyYW1lLCBpbWFnZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gT25seSBuZWVkZWQgd2hlbiBoYW5kbGluZyBzaGVldHMgKGltYWdlcykgYmV5b25kXG4gICAgY3VyckZyYW1lID0gYWRqdXN0RnJhbWVQb3NpdGlvbihcbiAgICAgIGN1cnJGcmFtZSxcbiAgICAgIGltYWdlLFxuICAgICAgdGVtcGxhdGVJbWFnZSxcbiAgICAgIC8vIFRoZSBpbml0aWFsIGZyYW1lIGFkanVzdG1lbnQgc2hvdWxkIHVzZSBhIGxhcmdlciBzZWFyY2hcbiAgICAgIC8vIHNwYWNlIHRvIGFjY291bnQgZm9yIHRoZSBmYWN0IHRoYXQgdGhlcmUgY291bGQgYmUgbW92ZW1lbnRcbiAgICAgIC8vIGluIHRoZSBvdmVyYWxsIGdyaWQgcG9zaXRpb24gYmV0d2VlbiBmcmFtZXMuXG4gICAgICAxLjUqc2VhcmNoU2l6ZUZyYWN0aW9uXG4gICAgKTtcbiAgfVxuXG4gIGxldCBmcmFtZXM6IEZyYW1lW10gPSBbY3VyckZyYW1lXTtcblxuICB3aGlsZSAoXG4gICAgIShjdXJyRnJhbWUucm93ID09PSBncmlkLm5Sb3dzIC0gMSAmJiBjdXJyRnJhbWUuY29sID09PSBncmlkLm5Db2xzIC0gMSlcbiAgKSB7XG4gICAgY29uc3QgbXNnOiBXb3JrZXJNZXNzYWdlID0geyB0eXBlOiBcIm5ld0ZyYW1lXCIsIGZyYW1lOiBjdXJyRnJhbWUgfTtcbiAgICBwb3N0TWVzc2FnZShtc2cpO1xuXG4gICAgY29uc3QgbmV4dEZyYW1lID0gbG9jYXRlTmV4dEZyYW1lKFxuICAgICAgaW1hZ2UsXG4gICAgICBjdXJyRnJhbWUsXG4gICAgICBmcmFtZVNwYWNpbmdXaWR0aCxcbiAgICAgIGZyYW1lU3BhY2luZ0hlaWdodCxcbiAgICAgIGdyaWQsXG4gICAgICB0ZW1wbGF0ZUltYWdlXG4gICAgKTtcblxuICAgIC8vIEtlZXAgb25seSB0aGUgbGFzdCBuTGFnRnJhbWVzXG4gICAgZnJhbWVzLnB1c2gobmV4dEZyYW1lKTtcbiAgICBpZiAoZnJhbWVzLmxlbmd0aCA+IG5MYWdGcmFtZXMpIHtcbiAgICAgIGZyYW1lcyA9IGZyYW1lcy5zbGljZSgxKTtcbiAgICB9XG5cbiAgICBsZXQgbWVhbkltYWdlOiBjdi5NYXQgPSBuZXcgY3YuTWF0KFxuICAgICAgdGVtcGxhdGVJbWFnZS5yb3dzLFxuICAgICAgdGVtcGxhdGVJbWFnZS5jb2xzLFxuICAgICAgdGVtcGxhdGVJbWFnZS50eXBlKCksXG4gICAgICBbMCwgMCwgMCwgMF1cbiAgICApO1xuXG4gICAgZm9yIChjb25zdCBmcmFtZSBvZiBmcmFtZXMuc2xpY2UoMCwgMSkpIHtcbiAgICAgIGNvbnN0IGZyYW1lTWF0ID0gY3JvcEZyb21GcmFtZShmcmFtZSwgaW1hZ2UpXG4gICAgICBjdi5hZGRXZWlnaHRlZChcbiAgICAgICAgbWVhbkltYWdlLFxuICAgICAgICAxLFxuICAgICAgICBmcmFtZU1hdCxcbiAgICAgICAgMSAvIGZyYW1lcy5sZW5ndGgsXG4gICAgICAgIDAsXG4gICAgICAgIG1lYW5JbWFnZVxuICAgICAgKTtcbiAgICAgIGZyYW1lTWF0LmRlbGV0ZSgpXG4gICAgfVxuICAgIC8vIGRlYWxsb2NhdGUgdGhlIHByZXZpb3VzIHRlbXBsYXRlIGltYWdlIGJlZm9yZSBhc3NpZ25pbmcgdGhlIG5ldyBvbmVcbiAgICB0ZW1wbGF0ZUltYWdlLmRlbGV0ZSgpXG4gICAgdGVtcGxhdGVJbWFnZSA9IG1lYW5JbWFnZTtcblxuICAgIGN1cnJGcmFtZSA9IG5leHRGcmFtZTtcbiAgfVxuXG4gIGNvbnN0IG1zZzogV29ya2VyTWVzc2FnZSA9IHsgdHlwZTogXCJuZXdGcmFtZVwiLCBmcmFtZTogY3VyckZyYW1lIH07XG4gIHBvc3RNZXNzYWdlKG1zZyk7XG4gIGNvbnN0IGVuZE1zZzogV29ya2VyTWVzc2FnZSA9IHsgdHlwZTogXCJzaGVldEVuZFwiIH07XG4gIHBvc3RNZXNzYWdlKGVuZE1zZyk7XG4gIHJldHVybiB0ZW1wbGF0ZUltYWdlO1xufVxuXG5jdltcIm9uUnVudGltZUluaXRpYWxpemVkXCJdID0gKCkgPT4ge1xuICBvbm1lc3NhZ2UgPSAoZSkgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIGltYWdlRGF0YSxcbiAgICAgIGZpcnN0RnJhbWUsXG4gICAgICBmcmFtZVNwYWNpbmdCb3gsXG4gICAgICBncmlkRGltZW5zaW9ucyxcbiAgICB9OiB7XG4gICAgICBpbWFnZURhdGE6IEltYWdlRGF0YTtcbiAgICAgIGZpcnN0RnJhbWU6IEZyYW1lO1xuICAgICAgZnJhbWVTcGFjaW5nQm94OiBCb3g7XG4gICAgICBncmlkRGltZW5zaW9uczogR3JpZDtcbiAgICB9ID0gZS5kYXRhO1xuXG4gICAgdHJ5IHtcblxuICAgICAgY29uc3QgaW1hZ2VNYXQgPSBjdi5tYXRGcm9tSW1hZ2VEYXRhKGltYWdlRGF0YSk7XG4gICAgICBjb25zdCBmcmFtZVNwYWNpbmdIZWlnaHQgPSBmcmFtZVNwYWNpbmdCb3guaGVpZ2h0IC0gMiAqIGZpcnN0RnJhbWUuaGVpZ2h0O1xuICAgICAgY29uc3QgZnJhbWVTcGFjaW5nV2lkdGggPSBmcmFtZVNwYWNpbmdCb3gud2lkdGggLSAyICogZmlyc3RGcmFtZS53aWR0aDtcblxuICAgICAgLy8gVGhpcyBpcyBhIGJpdCBoYWNreS4gdGVtcGxhdGVJbWFnZSBpcyBnbG9iYWwgc3RhdGVcbiAgICAgIC8vIHNvIHRoYXQgaXQgcGVyc2lzdHMgYmV0d2VlZW4gZGV0ZWN0aW9ucyBmb3IgYWRqYWNlbnRcbiAgICAgIC8vIHNoZWV0cy4gQW4gYWx0ZXJuYXRpdmUgd291bGQgYmUgdG8gcG9zdCB0aGUgdGVtcGxhdGVcbiAgICAgIC8vIGltYWdlIG9uIHRoZSBcInNoZWV0IGVuZFwiIG1lc3NhZ2UuIEJ1dCBjdi5NYXQgaXNuJ3RcbiAgICAgIC8vIHNlcmlhbGl6YWJsZS5cbiAgICAgIGlmIChmaXJzdEZyYW1lLnNoZWV0ID09IDAgJiYgdGVtcGxhdGVJbWFnZSAhPT0gbnVsbCkge1xuICAgICAgICB0ZW1wbGF0ZUltYWdlLmRlYWxsb2NhdGVcbiAgICAgICAgdGVtcGxhdGVJbWFnZSA9IG51bGxcbiAgICAgIH1cbiAgICAgIC8vIGFzc2lnbiB0byB0ZW1wbGF0ZUltYWdlIHNvIHRoYXQgaXQgaXMgdXNlZCBvbiB0aGUgbmV4dCBzaGVldFxuICAgICAgY29uc3QgbmV3VGVtcGxhdGVJbWFnZSA9IGNyb3BGcmFtZXNGcm9tSW1hZ2UoXG4gICAgICAgIGltYWdlTWF0LFxuICAgICAgICBmaXJzdEZyYW1lLFxuICAgICAgICBmcmFtZVNwYWNpbmdXaWR0aCxcbiAgICAgICAgZnJhbWVTcGFjaW5nSGVpZ2h0LFxuICAgICAgICBncmlkRGltZW5zaW9ucyxcbiAgICAgICAgMC4yNSxcbiAgICAgICAgMTYsXG4gICAgICAgIHRlbXBsYXRlSW1hZ2VcbiAgICAgICk7XG4gICAgICAvLyBkZWFsbG9jYXRlIG9sZCB0ZW1wbGF0ZSBpbWFnZSBhbmQgYXNzaWduIHRoZSBuZXcgb25lXG4gICAgICB0ZW1wbGF0ZUltYWdlID0gbmV3VGVtcGxhdGVJbWFnZVxuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBjb25zb2xlLnRyYWNlKClcbiAgICAgIGNvbnN0IGVyck1zZzogV29ya2VyTWVzc2FnZSA9IHt0eXBlOiBcImVycm9yXCIsIGVycm9yOiBlcnIuc3RhY2t9XG4gICAgICBwb3N0TWVzc2FnZShlcnJNc2cpXG4gICAgfVxuICB9O1xufTtcbiJdLCJuYW1lcyI6WyJjdiIsInRlbXBsYXRlSW1hZ2UiLCJjcm9wRnJvbUZyYW1lIiwiZnJhbWUiLCJpbWFnZSIsInJvaSIsIngiLCJ5Iiwid2lkdGgiLCJoZWlnaHQiLCJsb2NhdGVOZXh0RnJhbWUiLCJjdXJyRnJhbWUiLCJmcmFtZVNwYWNpbmdXaWR0aCIsImZyYW1lU3BhY2luZ0hlaWdodCIsImdyaWQiLCJzZWFyY2hTaXplRnJhY3Rpb24iLCJyb3ciLCJuUm93cyIsImNvbCIsIm5Db2xzIiwiRXJyb3IiLCJuZXh0RnJhbWUiLCJyb3dzIiwiY29scyIsImFkanVzdGVkRnJhbWUiLCJhZGp1c3RGcmFtZVBvc2l0aW9uIiwic2VhcmNoU2l6ZVdpZHRoIiwiTWF0aCIsInJvdW5kIiwic2VhcmNoU2l6ZUhlaWdodCIsInltaW4iLCJtYXgiLCJ5bWF4IiwibWluIiwieG1pbiIsInhtYXgiLCJzZWFyY2hJbWFnZSIsInJlc3VsdCIsIk1hdCIsIkNWXzMyRkMxIiwibWF0Y2hUZW1wbGF0ZSIsIlRNX0NDT0VGRl9OT1JNRUQiLCJtaW5NYXgiLCJtaW5NYXhMb2MiLCJkZWxldGUiLCJtYXhMb2MiLCJjcm9wRnJhbWVzRnJvbUltYWdlIiwiZmlyc3RGcmFtZSIsIm5MYWdGcmFtZXMiLCJmcmFtZXMiLCJtc2ciLCJ0eXBlIiwicG9zdE1lc3NhZ2UiLCJwdXNoIiwibGVuZ3RoIiwic2xpY2UiLCJtZWFuSW1hZ2UiLCJmcmFtZU1hdCIsImFkZFdlaWdodGVkIiwiZW5kTXNnIiwib25tZXNzYWdlIiwiZSIsImltYWdlRGF0YSIsImZyYW1lU3BhY2luZ0JveCIsImdyaWREaW1lbnNpb25zIiwiZGF0YSIsImltYWdlTWF0IiwibWF0RnJvbUltYWdlRGF0YSIsInNoZWV0IiwiZGVhbGxvY2F0ZSIsIm5ld1RlbXBsYXRlSW1hZ2UiLCJlcnIiLCJjb25zb2xlIiwidHJhY2UiLCJlcnJNc2ciLCJlcnJvciIsInN0YWNrIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./app/crop-frames.ts\n");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendor-chunks/@techstark"], () => (__webpack_require__("(ssr)/./app/crop-frames.ts")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			"crypto-fs-path-_ssr_app_crop-frames_ts": 1
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.O.require = (chunkId) => (installedChunks[chunkId]);
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 			__webpack_require__.O();
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__webpack_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					installChunk(require("./" + __webpack_require__.u(chunkId)));
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			__webpack_require__.e("vendor-chunks/@techstark");
/******/ 			return next();
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;