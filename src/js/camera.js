

function runDisplayLoop() {

    const state = window.readGameState();
    clearCanvas(state);

    drawPageTitle(state);
    if (state.game.phase === PHASE_2_LIVE) {
        drawGameScene(state);
    }
    else if(state.game.phase === PHASE_1_COUNTDOWN) {
        drawLoadingIcon(state);
    }
    drawButtons(state);

    if(state.isDebug) {
        drawDebugData(state);
    }

    window.requestAnimationFrame(runDisplayLoop)
}

function clearCanvas(state) {
    state.ctx.clearRect(0, 0, state.camera.canvasW * 2, state.camera.canvasH * 2)
}

function drawButtons(state) {
    state.buttons.forEach(btn => {
        if(btn.boxCoord === null) {
            return;
        }
        if(btn.type === BUTTON_TYPE_GRID) {
            const rectArgs = boxCoordToRectArgs(btn.boxCoord);
            state.ctx.beginPath();
            state.ctx.fillStyle = btn.disabled ? "#5e5e5e" : "#000";
            state.ctx.rect(...rectArgs);
            state.ctx.fill();

            state.ctx.beginPath();
            state.ctx.font = btn.disabled ? "20px Arial" : "bold 24px Arial";
            state.ctx.fillStyle = btn.disabled ? "#fff" : "#0f0";
            state.ctx.textBaseline = "middle";
            state.ctx.textAlign = "center";
            state.ctx.fillText(
                btn.text,
                rectArgs[0] + Math.floor(rectArgs[2] / 2),
                rectArgs[1] + Math.floor(rectArgs[3] / 2),
            );
        }
        else if (btn.type === BUTTON_TYPE_CTRL) {
            const selected = btn.selected(state);
            state.ctx.beginPath();
            state.ctx.fillStyle = selected ? "#c2ffc2" : "#bfbfbf";
            state.ctx.strokeStyle = selected ? "#003800" : "#383838";
            state.ctx.lineWidth = 1;
            state.ctx.rect(...boxCoordToRectArgs(btn.boxCoord));
            state.ctx.fill();
            state.ctx.stroke();

            const btnYMid = Math.round((btn.boxCoord[0][1] + btn.boxCoord[1][1]) / 2);
            const imgWidth = btn.boxCoord[1][0] - btn.boxCoord[0][0];
            const imgHeight = Math.round(imgWidth / 3);
            const imgX1 = 0
            const imgY1 = btnYMid - (imgHeight / 2);
            state.ctx.drawImage(
                btn.asset,
                imgX1, imgY1,
                imgWidth, imgHeight
            )

        }
        else if (btn.type === BUTTON_TYPE_MAIN) {
            state.ctx.beginPath();
            state.ctx.fillStyle = "#000"
            state.ctx.rect(...boxCoordToRectArgs(btn.boxCoord));
            state.ctx.fill();

            state.ctx.beginPath();
            state.ctx.textBaseline = "middle";
            state.ctx.textAlign = "center";
            state.ctx.font = "bold 20px Arial";
            state.ctx.fillStyle = "#fff";
            state.ctx.fillText(
                btn.text,
                Math.round((btn.boxCoord[1][0] + btn.boxCoord[0][0]) / 2),
                Math.round((btn.boxCoord[1][1] + btn.boxCoord[0][1]) / 2),
            );
        }
    });
}

function drawPageTitle(state) {
    if(state.pageTitle) {
        state.ctx.beginPath();
        state.ctx.fillStyle = state.pageTitle.color;
        state.ctx.font = "bold 38px Arial";
        state.ctx.textBaseline = "middle";
        state.ctx.textAlign = "center";
        state.ctx.fillText(
            state.pageTitle.text,
            state.camera.canvasHalfW,
            30,
        );
    }
}

function drawLoadingIcon(state) {
    const percent = Math.min(1, (
        state.game.countDownFrames
        / state.game.maxCountDownFrames
    ) * 1.15);
    state.ctx.beginPath();
    state.ctx.strokeStyle = COLOR_PURPLE;
    state.ctx.lineWidth = 18 * percent;
    state.ctx.arc(
        state.camera.canvasHalfW,
        140,
        65,
        0,
        percent * TWO_PI,
    );
    state.ctx.stroke();
}

function mapCoordToCanvasCoord(mapCoord, cameraPosition, camera) {
    const mapDx = mapCoord[0] - cameraPosition[0];
    const mapDy = mapCoord[1] - cameraPosition[1];
    return [
        mapDx + camera.canvasHalfW,
        camera.canvasH - (mapDy + camera.canvasHalfH),
    ];
}

function drawGameScene(state) {
    const plane = state.plane;
    const mapDims = plane.dimensions[plane.attitude];

    // Draw Glide Slope
    const gsCanvasP0 = mapCoordToCanvasCoord(
        state.map.gsP0MapCoord, plane.posMapCoord, state.camera
    );
    const gsCanvasP1 = mapCoordToCanvasCoord(
        state.map.gsP1MapCoord, plane.posMapCoord, state.camera
    );
    state.ctx.beginPath();
    state.ctx.strokeStyle = "#f200ff";
    state.ctx.lineWidth = 2;
    state.ctx.moveTo(...gsCanvasP0);
    state.ctx.lineTo(...gsCanvasP1);
    state.ctx.stroke();


    if(!plane.crashFrame) {
        const canvasDims = mapDims.map(d => d * state.map.mapUnitsPerMeter);
        const planeCanvasX1 = state.camera.canvasHalfW - (canvasDims[0] / 2);
        const planeCanvasY1 = state.camera.canvasHalfH - (canvasDims[1] / 2);
        state.ctx.drawImage(
            plane.assets[plane.attitude],
            planeCanvasX1,
            planeCanvasY1,
            canvasDims[0],
            canvasDims[1],
        );
    }

    for(let i = 0; i < plane.previousPoints.length; i++) {
        let [mapCoord, isThrusting] = plane.previousPoints[i];

        let canvasCoord = mapCoordToCanvasCoord(
            mapCoord, plane.posMapCoord, state.camera
        );
        state.ctx.beginPath();
        state.ctx.fillStyle = isThrusting ? "#4d4d4d" : "#a6a6a6";
        state.ctx.arc(
            canvasCoord[0], canvasCoord[1],
            isThrusting ? 9 : 5,
            0, TWO_PI,
        );
        state.ctx.fill();
    }
}

function drawDebugData(state) {
    // Text info
    state.ctx.beginPath();
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "right";
    state.ctx.fillStyle = "black";
    state.ctx.font = "normal 18px Arial";

    let yPointer = state.camera.canvasH - 10;
    const yInterval = 20;
    const xOffset =  state.camera.canvasW - 10;

    state.ctx.fillText(`FPS: ${Math.round(state.game.dataFPS)}`, xOffset, yPointer);
    yPointer -= yInterval;
    state.ctx.fillText(`phase: ${state.game.phase}`, xOffset, yPointer);
    yPointer -= yInterval;
    state.ctx.fillText(`attitude: ${state.plane.attitude}`, xOffset, yPointer);
    yPointer -= yInterval;
    state.ctx.fillText(`thrust: ${state.plane.thrust}`, xOffset, yPointer);
    yPointer -= yInterval;
    if(Array.isArray(state.plane.posMapCoord)) {
        state.ctx.fillText(`X pos: ${Math.round(state.plane.posMapCoord[0])}`, xOffset, yPointer);
        yPointer -= yInterval;
        state.ctx.fillText(`Y pos: ${Math.round(state.plane.posMapCoord[1])}`, xOffset, yPointer);
        yPointer -= yInterval;
    }
    state.ctx.fillText(`X m/s: ${Math.round(state.plane.horizontalMS, 2)}`, xOffset, yPointer);
    yPointer -= yInterval;
    state.ctx.fillText(`Y m/s: ${Math.round(state.plane.verticalMS, 2)}`, xOffset, yPointer);
    yPointer -= yInterval;

    // Draw map scape
    if(state.map.mapUnitsPerMeter && state.camera.canvasH) {
        const msXOffset = 25;
        const msYOffset = 15;
        const msPXLen = state.camera.canvasW / 3;
        const msMLen = Math.round(msPXLen / state.map.mapUnitsPerMeter, 1)
        const msP0 = [msXOffset, state.camera.canvasH - msYOffset];
        const msP1 = [msXOffset + msPXLen, state.camera.canvasH - msYOffset];
        state.ctx.beginPath();
        state.ctx.strokeStyle = "#000000";
        state.ctx.lineWidth = 2;
        state.ctx.moveTo(...msP0);
        state.ctx.lineTo(...msP1);
        state.ctx.stroke();
        state.ctx.beginPath();
        state.ctx.textBaseline = "bottom";
        state.ctx.textAlign = "right";
        state.ctx.fillStyle = "black";
        state.ctx.font = "normal 18px Arial";
        state.ctx.fillText(`${msMLen}M`, ...msP1);
    }
}
