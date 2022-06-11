
function getHelpImg() {
    const img = new Image();
    img.src = "img/how-to-play.svg";
    return img;
}

function createNewState(maxCompletedLevel) {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d")
    maxCompletedLevel = maxCompletedLevel || 0;
    const availableLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return {
        isDebug: urlContainsDebug(),
        ctx,
        helpImg: getHelpImg(),
        pageTitle: {
            text: "Select A Level",
            color: COLOR_PURPLE,
        },
        game: {
            phase: PHASE_0_LOBBY,
            maxCountDownFrames: 60,
            countDownFrames: 0,
            frame: 0,
            maxCompletedLevel,
            availableLevels,
            dataFPS: null,
            level: null,
            lastFrameTS: performance.now(),
            acceptControlCommands: false,
            lastClick: {
                canvasCoord: null,
                frameCreated: null,
                color: null,
            }
        },
        camera: {
            canvasW: null,
            canvasH: null,
            canvasHalfW: null,
            canvasHalfH: null,
        },
        plane: {
            asset: null,
            assets: [],
            dimensions: [],
            posMapCoord: null,
            horizontalMS: null,
            verticalMS: null,
            lastLevelOutTS: null,
            lastLevelOutFrame: null,
            leveledOutInitialHorizontalMS: null,
            leveledOutTerminalHorizontalMS: null,
            leveledOutHorizontalAccelerationMS2: null,
            leveledOutTerminalVerticalMS: null,
            leveledOutVerticalAccelerationMS2Curve: null,
            flare: IS_NOT_FLARING,
            lastFlareTS: null,
            lastFlareFrame: null,
            flareTerminalHorizontalMS: null,
            flareHorizontalAccelerationMS2: null,
            flareVerticalAccelerationMS2Curve: null,
            touchDownFlareMinMS: null,
            minTouchdownVerticalMS: null,
            touchdownStats: {
                runwayUsedM: null,
                runwayWastedM: null,
                verticalMS: null,
                isSmooth: false,
                isRough: false,
                isFlaired: false,
                bounces: 0,
            },
            adjustPlanePosition: (state) => {},
            previousPoints: [],
            crashFrame: 0,
            touchedDown: false,
            halted: false,
            rwNegAccelerationMS: null,
        },
        map: {
            terrain: null,
            mapUnitsPerMeter: null,
            windXVel: null,
            windVolitility: null,
            windXMin: null,
            windXMax: null,
            windXTarg: null,
            rwP0MapCoord: null,
            rwP1MapCoord: null,
            gsP0MapCoord: null,
            gsP1MapCoord: null,
            tireStrikes: [],
        },
        buttons: [{
            type: BUTTON_TYPE_MAIN,
            text: "Help",
            boxCoord: null,
            handler: () => {
                window.addCommand({
                    cmd: COMMAND_SHOW_HELP,
                });
            }
        }].concat(availableLevels.map(levelNumber => {
            const disabled = levelNumber > (maxCompletedLevel + 1);
            const btn = {
                type: BUTTON_TYPE_GRID,
                text: disabled ? '🔒' : `Level ${levelNumber}`,
                boxCoord: null,
                disabled,
                handler: disabled ? ()=>{} : () => {
                    window.addCommand({
                        cmd: COMMAND_START_LEVEL,
                        args: [ levelNumber ],
                    });
                }
            };
            return btn;
        })),
    }
}

function orientButtons(state) {
    const gridBtns = [], mainBtns = [], ctrlBtns = [];
    state.buttons.forEach((btn, wix) => {
        if(btn.type === BUTTON_TYPE_GRID) {
            gridBtns.push([btn, wix]);
        } else if(btn.type === BUTTON_TYPE_MAIN) {
            mainBtns.push([btn, wix]);
        } else {
            throw NOT_IMPLEMENTED;
        }
    });

    if(gridBtns.length) {
        const gridBtnsCount = gridBtns.length;
        const gridBtnMargin = 4;
        const gridBtnWidth = 125;
        const gridBtnHeight = 40;
        const gridBtnCol0XOffset = state.camera.canvasHalfW - (gridBtnWidth + gridBtnMargin)// 30;
        const gridBtnRow0YOffset = 100;
        let rowPointer = 0;
        let colPointer = 0;
        const gridMaxRows = Math.min(5, Math.floor(
            state.camera.canvasH - (gridBtnRow0YOffset * 2) / gridBtnHeight
        ));

        for(let i=0; i < gridBtnsCount; i++) {
            let [_btn, wix] = gridBtns[i];
            let btnX1 = gridBtnCol0XOffset + (colPointer * gridBtnWidth) + (gridBtnMargin * colPointer);
            let btnX2 = btnX1 + gridBtnWidth;
            let btnY1 = gridBtnRow0YOffset + (rowPointer * gridBtnHeight) + (gridBtnMargin * rowPointer);
            let btnY2 = btnY1 + gridBtnHeight;
            state.buttons[wix].boxCoord =  [[btnX1, btnY1], [btnX2, btnY2]]

            rowPointer++
            if(rowPointer >= gridMaxRows) {
                rowPointer = 0;
                colPointer++;
            }
        }
    }

    if(ctrlBtns.length) {
        const ctrlBtnsCount = ctrlBtns.length;
        const ctrlBtnHeight = Math.floor(state.camera.canvasH * 0.95 / ctrlBtnsCount);
        const ctrlBtnWidth = Math.min(state.camera.canvasW / 10, 60);
        let y1Pointer = 0;
        for(let i = 0; i < ctrlBtnsCount; i++) {
            let [_btn, wix] = ctrlBtns[i];

            if(state.buttons[wix].assetHref && !state.buttons[wix].asset) {
                state.buttons[wix].asset = new Image();
                state.buttons[wix].asset.src = state.buttons[wix].assetHref;
            }

            state.buttons[wix].boxCoord =  [
                [0, y1Pointer],
                [ctrlBtnWidth, y1Pointer + ctrlBtnHeight]
            ]
            y1Pointer += ctrlBtnHeight;
        }
    }

    if(mainBtns.length) {
        const mainBtnsCount = mainBtns.length;
        const mainBtnHeight = 38;
        const mainBtnWidth = 100;
        let x1Pointer = state.camera.canvasW - mainBtnWidth;
        for(let i = 0; i < mainBtnsCount; i++) {
            let [_btn, wix] = mainBtns[i];
            state.buttons[wix].boxCoord =  [
                [x1Pointer, 0],
                [x1Pointer + mainBtnWidth, mainBtnHeight]
            ];
            x1Pointer -= mainBtnWidth;
        }
    }

    return state;
}


function runDataLoop() {
    let state = window.readGameState();

    // Calculate FPS
    const nowTS = performance.now();
    const lastFrameTS = state.game.lastFrameTS;
    const diff = nowTS - lastFrameTS;
    const fps = 1000 / diff;
    state.game.lastFrameTS = nowTS;
    state.game.dataFPS = fps;

    // Position buttons and check for clicks
    state = orientButtons(state);
    const nextClick = window.nextClick();
    if(nextClick) {
        const isArrow = nextClick.clickCanvasCoord === null;
        nextClick.clickCanvasCoord = nextClick.clickCanvasCoord || [state.camera.canvasHalfW, state.camera.canvasHalfH]
        const isBottomHalfClick = nextClick.clickCanvasCoord[1] > state.camera.canvasHalfH;
        let isFlareCmd;
        if(nextClick.isDoubleClick) {
            window.addCommand({
                cmd: COMMAND_FLARE,
            });
            isFlareCmd = true;
        } else {
            let isButtonClick = false;
            for(let i = 0; i < state.buttons.length; i++) {
                let clickInside = coordInsideBoxCoord(
                    nextClick.clickCanvasCoord,
                    state.buttons[i].boxCoord,
                )
                if (clickInside) {
                    state.buttons[i].handler();
                    isButtonClick = true;
                    break;
                }
            }
            if (!isButtonClick) {
                const cmd = isArrow ? (nextClick.isDoubleClick ? COMMAND_FLARE : COMMAND_LEVEL_OUT) : isBottomHalfClick ? COMMAND_LEVEL_OUT : COMMAND_FLARE;
                isFlareCmd = cmd === COMMAND_FLARE;
                window.addCommand({ cmd });
            }
        }
        if (typeof isFlareCmd !== "undefined") {
            state.game.lastClick = {
                canvasCoord: deepCopy(nextClick.clickCanvasCoord),
                frameCreated: state.game.frame,
                color: isFlareCmd ? COLOR_CLICK_RING_DOUBLE : COLOR_CLICK_RING_SINGLE,
            };
        }
    }

    if(state.game.phase === PHASE_2_LIVE) {
        let commands = [];
        while(true) {
            let cmd = window.nextCommand()
            if(cmd) {
                commands.push(cmd);
            } else {
                break;
            }
        }

        state.game.frame++;
        if(state.game.frame % 500 === 0) {
            console.log({ state });
        }

        // Process commands
        const cmdCt = commands.length;
        for(let i=0; i<cmdCt; i++) {
            let cmd = commands[i];
            if(cmd.cmd === COMMAND_QUIT_LEVEL) {
                window.setGameState(
                    updateCameraCanvasMetaData(
                        createNewState(state.game.maxCompletedLevel)
                    )
                );
                setTimeout(runDataLoop);
                return;
            }
            else if(cmd.cmd === COMMAND_LEVEL_OUT && state.game.acceptControlCommands) {
                state.plane.lastLevelOutTS = performance.now();
                state.plane.lastLevelOutFrame = state.game.frame;
            }
            else if(cmd.cmd === COMMAND_FLARE && state.game.acceptControlCommands) {
                state.plane.flare = IS_FLARING;
                state.plane.lastFlareTS = performance.now();
                state.plane.lastFlareFrame = state.game.frame;
            }
        }

        if(state.plane.crashFrame) {
            state.plane.crashFrame++;
            if(state.plane.crashFrame > 200) {
                // Score screen
            }
        }

        // Adjust state for plane flying through the air
        if(!state.plane.touchedDown && !state.plane.crashFrame) {
            state = state.plane.adjustPlanePosition(state);
        }

        // check for ground contact and adjust state for plane
        // that is touching the ground.
        if(!state.plane.crashFrame && !state.plane.halted) {
            state = processGroundInteractions(state);
        }

        if(state.game.frame %  10 === 0 && !state.plane.halted && !state.plane.touchedDown) {
            state.plane.previousPoints.unshift(
                deepCopy(state.plane.posMapCoord)
            );
            state.plane.previousPoints = state.plane.previousPoints.slice(0, 10);
        }

        window.setGameState(state);

        const runtime = performance.now() - nowTS;
        const targetRuntimeMS = 16.667; // 60 FPS
        const timeout = Math.max(0, (targetRuntimeMS - runtime));
        setTimeout(runDataLoop, timeout);

        return;
    }

    // process commands
    const nextCmd = window.nextCommand();
    if(nextCmd) {
        if(
            nextCmd.cmd === COMMAND_START_LEVEL
            && state.game.phase === PHASE_0_LOBBY
        ) {
            state.game.phase = PHASE_1_COUNTDOWN;
            state.game.level = nextCmd.args[0];
            state.pageTitle = {
                text: "Get Ready!",
                color: COLOR_PURPLE,
            }
            state.buttons = [];
        }
        if(
            nextCmd.cmd === COMMAND_SHOW_HELP
            && state.game.phase === PHASE_0_LOBBY
        ) {
            state.game.phase = PHASE_N1_SHOW_HELP;
            state.pageTitle = null;
            state.buttons = [{
                type: BUTTON_TYPE_MAIN,
                boxCoord: null,
                text: 'Menu',
                handler: () => {
                    location.reload(); // fix this
                    return;
                },
            }];
        }
    }

    // process count down
    if(state.game.phase === PHASE_1_COUNTDOWN) {
        state.game.countDownFrames++;
        if(state.game.countDownFrames >= state.game.maxCountDownFrames) {
            state.pageTitle = null;
            state.game.frame = 1;
            state.game.phase = PHASE_2_LIVE,
            state.game.acceptControlCommands = true;

            state = setPlaneProps(state);
            state = setMapProps(state);

            state.buttons = [{
                type: BUTTON_TYPE_MAIN,
                boxCoord: null,
                text: 'QUIT',
                handler: () => {
                    window.addCommand({
                        cmd: COMMAND_QUIT_LEVEL,
                    });
                },
            }];
        }
    }

    window.setGameState(state);

    const runtime = performance.now() - nowTS;
    const targetRuntimeMS = 16.667; // 60 FPS
    const timeout = Math.max(0, (targetRuntimeMS - runtime));
    setTimeout(runDataLoop, timeout);
    return;
}


function processGroundInteractions(state) {
    const plane = state.plane;
    if(plane.crashFrame) {
        throw NOT_IMPLEMENTED;
    }
    const fps = state.game.dataFPS;

    const planeBottomMapCoordY = (
        state.plane.posMapCoord[1]
        - (
            state.plane.dimensions[state.plane.flare][1] / 2
            * state.map.mapUnitsPerMeter
        )
    );

    if(plane.touchedDown) {
        // Plane has touched down and negatively accelerating
        if(plane.horizontalMS > 0) {
            const deltaHVMF = plane.rwNegAccelerationMS * (!plane.flare ? 1 : 2) / fps;
            const newHorizontalMS = Math.max(0, plane.horizontalMS + deltaHVMF)
            state.plane.horizontalMS = newHorizontalMS;
            if(newHorizontalMS > 0) {
                state.plane.posMapCoord[0] += (newHorizontalMS * state.map.mapUnitsPerMeter / fps);
                if(state.plane.posMapCoord[0] > state.map.rwP1MapCoord[0]) {
                    // Plane overan the runway
                    console.log("👉 overran runway");
                    state.plane.crashFrame++;
                }
                else {
                    if(
                        plane.flare === IS_FLARING
                        && newHorizontalMS < plane.touchDownFlareMinMS
                    ) {
                        state.plane.flare = IS_NOT_FLARING;
                        state.map.tireStrikes.push({
                            originMapPoint: deepCopy([
                                plane.posMapCoord[0] + plane.dimensions[IS_NOT_FLARING][0] / 2 * state.map.mapUnitsPerMeter,
                                planeBottomMapCoordY,
                            ]),
                            createdTS: performance.now(),
                        });
                        console.log("👉 end of flare");
                    }
                }
            }
        } else {
            console.log("👉 halted");
            state.plane.halted = true;
        }
        return state;
    }

    const planeBottomDiffY = state.plane.posMapCoord[1] - planeBottomMapCoordY;
    const overRunway = Boolean(
        state.plane.posMapCoord[0] >= state.map.rwP0MapCoord[0]
        && state.plane.posMapCoord[0] <= state.map.rwP1MapCoord[0]
    );

    // Plane crashed into the ground
    if(!overRunway && planeBottomMapCoordY <= 0) {
        state.plane.crashFrame++;
        return state;
    }

    const touchingRunway = Boolean(
        overRunway
        && planeBottomMapCoordY <= state.map.rwP0MapCoord[1]
    );
    if(touchingRunway) {

        const touchdownMS = state.plane.verticalMS;
        const isCrash = touchdownMS < state.plane.minTouchdownVerticalMS
        const noBounceMin = state.plane.minTouchdownVerticalMS * 0.333;
        const bigBounceMin = state.plane.minTouchdownVerticalMS * 0.666;
        let addRubberStrike = true;

        // check for plane crash into runway
        if (isCrash)
        {
            console.log("👉 crash");
            console.log({
                touchdownMS,
                flare: state.plane.flare,
            });
            state.plane.crashFrame++;
            addRubberStrike = false;
        }
        else if(!isCrash && touchdownMS >= noBounceMin) {
            // touchdown
            state.plane.touchedDown = true;
            state.game.acceptControlCommands = false;
            state.plane.verticalMS = 0;
            state.plane.posMapCoord[1] = state.map.rwP0MapCoord[1] + planeBottomDiffY;
            state.plane.touchdownStats.isSmooth = plane.touchdownStats.bounces === 0;
            state.plane.touchdownStats.verticalMS = touchdownMS;
            state.plane.touchdownStats.isFlaired = plane.flare === IS_FLARING;
            state.plane.touchdownStats.runwayWastedM = Math.max(
                0,
                Math.round(
                    (plane.posMapCoord[0] - state.map.gsP1MapCoord[0])
                    / state.map.mapUnitsPerMeter
                )
            );

            console.log("👉 touch down");
            console.log(state.plane.touchdownStats);

        } else if (!isCrash && touchdownMS > bigBounceMin) {
            // small bounce off landing
            state.plane.verticalMS = Math.abs(state.plane.verticalMS) * 0.8;
            state.plane.touchdownStats.bounces++;
            console.log("👉 small bounce");

        } else {
            // big bounce off runway
            state.plane.verticalMS = Math.abs(state.plane.verticalMS) * 1;
            state.plane.touchdownStats.isRough = true;
            state.plane.touchdownStats.bounces++;
            console.log("👉 big bounce");
        }

        if (addRubberStrike) {
            state.map.tireStrikes.push({
                originMapPoint: deepCopy([
                    plane.posMapCoord[0],
                    planeBottomMapCoordY,
                ]),
                createdTS: performance.now(),
            });
        }
    }

    return state;
}
