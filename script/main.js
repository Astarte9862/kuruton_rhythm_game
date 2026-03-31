exports.main = (param) => {
    const game = g.game;
    const b2 = require("@akashic-extension/akashic-box2d");

    // ===== 定数 =====
    const OPENING_TITLE_DURATION = 5000;
    const OPENING_TOTAL_DURATION = 12000;
    const ENDING_DELAY = 3000;

    const NOTE_SIZE = 155;
    const NOTE_SCALE = 0.4;
    const NOTE_OFFSET_X = 600;
    const NOTE_SPEED = 600 / 30;
    const NOTE_MAX_TRAVEL = 1800;

    const HIT_RANGE_GOOD = 60;
    const HIT_RANGE_GREAT = 20;
    const HIT_RANGE_PERFECT = 5;

    const SCORE_GOOD = 100;
    const SCORE_GREAT = 150;
    const SCORE_PERFECT = 200;

    const PLAY_AREA_PADDING = 100;
    const DEFAULT_TIME = 80;
    const START_BUFFER = 20;

    const NOTE_TIMINGS = [
        480, 1440, 2400, 3360, 4320, 5280, 6240, 7200, 8160, 9120,
        10080, 11040, 12000, 12960, 13680, 13680, 14880, 15840, 16800, 17760,
        18720, 19680, 20640, 21360, 21360, 22560, 23520, 24480, 25440, 26400,
        27120, 27840, 27840, 30240, 31200, 32160, 32640, 32640, 34080, 35040,
        36000, 36480, 36480, 37920, 38880, 39840, 40320, 40320, 41760, 42480,
        43200, 43200, 45600, 46560, 47520, 48000, 48000, 48480, 48480, 48480,
        49440, 50400, 51360, 51840, 51840, 52320, 52320, 52320, 53280, 54240,
        55200, 55660, 55660, 56160, 56160, 56160, 57120, 58080, 60000
    ];

    // ===== 共有スコア =====
    game.vars.gameState = { score: 0 };

    // ===== 本編シーン =====
    const scene = new g.Scene({
        game,
        assetPaths: [
            "/assets/images/*",
            "/assets/se/*",
            "/assets/fonts/*",
        ],
    });

    // ===== リザルトシーン =====
    const endingScene = new g.Scene({
        game,
        assetPaths: [
            "/assets/fonts/*",
            "/assets/ending/*",
        ],
    });

    endingScene.onLoad.addOnce(() => {
        const font = new g.BitmapFont({
            scene: endingScene,
            src: endingScene.asset.getImage("/assets/fonts/font-number-large.png"),
            glyphInfo: endingScene.asset.getJSONContent("/assets/fonts/font-number-large_glyphs.json"),
        });

        const resultPanel = new g.Sprite({
            scene: endingScene,
            src: endingScene.asset.getImage("/assets/ending/result.png"),
            x: game.width / 2,
            y: game.height / 2,
            anchorX: 0.5,
            anchorY: 0.5,
        });
        endingScene.append(resultPanel);

        const resultScoreLabel = new g.Label({
            scene: endingScene,
            font,
            fontSize: font.size,
            text: `${game.vars.gameState.score}`,
            x: resultPanel.x,
            y: resultPanel.y + 60,
            anchorX: 0.5,
            anchorY: 0.5,
        });
        endingScene.append(resultScoreLabel);
    });

    // ===== オープニングシーン =====
    const openingScene = new g.Scene({
        game,
        assetPaths: [
            "/assets/opening/*"
        ],
    });

    openingScene.onLoad.addOnce(() => {
        const titleLogo = new g.Sprite({
            scene: openingScene,
            src: openingScene.asset.getImage("/assets/opening/kuruto_title.png"),
            x: 0,
            y: 0,
            anchorX: 0,
            anchorY: -0.6,
        });
        openingScene.append(titleLogo);

        const descriptionLogo = new g.Sprite({
            scene: openingScene,
            src: openingScene.asset.getImage("/assets/opening/kuruto_description.png"),
            x: game.width / 2,
            y: game.height / 2,
            anchorX: 0.5,
            anchorY: 0.5,
            scaleX: 0.9,
            scaleY: 0.9,
        });

        openingScene.setTimeout(() => {
            if (!titleLogo.destroyed()) titleLogo.destroy();
            openingScene.append(descriptionLogo);
        }, OPENING_TITLE_DURATION);

        openingScene.setTimeout(() => {
            game.replaceScene(scene);
        }, OPENING_TOTAL_DURATION);
    });

    game.pushScene(openingScene);

    // ===== 本編初期化 =====
    scene.onLoad.add(() => {
        const seBgm = game.audio.create(scene.asset.getAudio("/assets/se/se_bgm"));
        const sePa = game.audio.create(scene.asset.getAudio("/assets/se/se_pa"));

        const background = new g.FilledRect({
            scene,
            cssColor: "#fff",
            x: 0,
            y: 0,
            width: game.width,
            height: game.height,
            opacity: 0.5,
        });
        scene.append(background);

        const font = new g.BitmapFont({
            scene,
            src: scene.asset.getImage("/assets/fonts/font-number.png"),
            glyphInfo: scene.asset.getJSONContent("/assets/fonts/font-number_glyphs.json"),
        });

        const scoreLabel = new g.Label({
            scene,
            font,
            fontSize: font.size,
            text: `${game.vars.gameState.score}`,
            x: game.width - 70,
            y: 10,
            anchorX: 1,
            anchorY: 0,
        });
        scene.append(scoreLabel);

        const timeLimit = param.sessionParameter.totalTimeLimit || DEFAULT_TIME;
        let remainingTime = timeLimit - START_BUFFER;

        const timerLabel = new g.Label({
            scene,
            font,
            fontSize: font.size,
            text: `${remainingTime}`,
            x: 100,
            y: 10,
            width: 70,
            anchorX: 1,
            anchorY: 0,
        });
        scene.append(timerLabel);

        function updateScoreLabel() {
            scoreLabel.text = `${game.vars.gameState.score}`;
            scoreLabel.invalidate();
        }

        function updateTimerLabel() {
            timerLabel.text = `${remainingTime}`;
            timerLabel.invalidate();
        }

        const world = {
            gravity: [0, 9.8],
            scale: 50,
            sleep: true,
        };
        const box2d = new b2.Box2D(world);

        scene.onUpdate.add(() => {
            box2d.step(1 / game.fps);
        });

        seBgm.play();

        function addScore(value) {
            game.vars.gameState.score += value;
            updateScoreLabel();
        }

        function getRandomPosition() {
            return {
                x: Math.floor(g.game.localRandom.generate() * (game.width - PLAY_AREA_PADDING * 2) + PLAY_AREA_PADDING),
                y: Math.floor(g.game.localRandom.generate() * (game.height - PLAY_AREA_PADDING * 2) + PLAY_AREA_PADDING),
            };
        }

        function calcJudgeScore(diffX) {
            const abs = Math.abs(diffX);

            if (abs <= HIT_RANGE_PERFECT) return SCORE_PERFECT;
            if (abs <= HIT_RANGE_GREAT) return SCORE_GREAT;
            if (abs <= HIT_RANGE_GOOD) return SCORE_GOOD;
            return 0;
        }

        function safeDestroy(entity) {
            if (entity && !entity.destroyed()) {
                entity.destroy();
            }
        }

        function generateKurutonEffect(x, y) {
            const entity = new g.E({
                scene,
                x,
                y,
                width: 0,
                height: 0,
            });

            const rect = new g.FilledRect({
                scene,
                cssColor: `hsl(${Math.floor(g.game.localRandom.generate() * 360)},100%,60%)`,
                width: NOTE_SIZE,
                height: NOTE_SIZE,
                anchorX: 0.5,
                anchorY: 0.5,
                x: 0,
                y: 0,
                opacity: 0.9,
            });
            entity.append(rect);

            const kuruton = new g.Sprite({
                scene,
                src: scene.asset.getImage("/assets/images/kuruton.png"),
                anchorX: 0.5,
                anchorY: 0.5,
                scaleX: NOTE_SCALE,
                scaleY: NOTE_SCALE,
                x: 0,
                y: 0,
            });
            entity.append(kuruton);

            const fixtureDef = box2d.createFixtureDef({
                density: 1.0,
                friction: 0.5,
                restitution: 0.3,
            });

            const bodyDef = box2d.createBodyDef({
                type: b2.BodyType.Dynamic,
                linearDamping: 0,
                angularDamping: 0,
                userData: 0,
            });

            fixtureDef.shape = box2d.createRectShape(NOTE_SIZE, NOTE_SIZE);
            box2d.createBody(entity, bodyDef, fixtureDef);

            scene.append(entity);
        }

        const activeNotes = [];

        function removeNote(note) {
            note.alive = false;
            safeDestroy(note.site);
            safeDestroy(note.lane);
            safeDestroy(note.moving);

            const index = activeNotes.indexOf(note);
            if (index >= 0) {
                activeNotes.splice(index, 1);
            }
        }

        function spawnNote() {
            const pos = getRandomPosition();

            const site = new g.Sprite({
                scene,
                src: scene.asset.getImage("/assets/images/kuruton.png"),
                anchorX: 0.5,
                anchorY: 0.5,
                scaleX: NOTE_SCALE,
                scaleY: NOTE_SCALE,
                x: pos.x,
                y: pos.y,
                opacity: 0.3,
            });
            scene.append(site);

            const lane = new g.FilledRect({
                scene,
                cssColor: "white",
                width: NOTE_SIZE,
                height: NOTE_SIZE,
                anchorX: 0.5,
                anchorY: 0.5,
                x: pos.x - NOTE_OFFSET_X,
                y: pos.y,
                opacity: 0.5,
            });
            scene.append(lane);

            const moving = new g.Sprite({
                scene,
                src: scene.asset.getImage("/assets/images/kuruton.png"),
                anchorX: 0.5,
                anchorY: 0.5,
                scaleX: NOTE_SCALE,
                scaleY: NOTE_SCALE,
                x: pos.x + NOTE_OFFSET_X,
                y: pos.y,
            });
            scene.append(moving);

            const note = {
                site,
                lane,
                moving,
                targetX: pos.x,
                targetY: pos.y,
                travel: 0,
                pendingScore: 0,
                judged: false,
                alive: true,
            };

            lane.onUpdate.add(() => {
                if (!note.alive) return;
                lane.x += NOTE_SPEED;
                lane.modified();
            });

            moving.onUpdate.add(() => {
                if (!note.alive) return;

                moving.x -= NOTE_SPEED;
                moving.modified();

                if (note.judged) {
                    addScore(note.pendingScore);
                    sePa.play();
                    generateKurutonEffect(note.targetX, note.targetY);
                    removeNote(note);
                    return;
                }

                note.travel += NOTE_SPEED;
                if (note.travel >= NOTE_MAX_TRAVEL) {
                    removeNote(note);
                }
            });

            activeNotes.push(note);
        }

        scene.onPointDownCapture.add(() => {
            for (let i = 0; i < activeNotes.length; i++) {
                const note = activeNotes[i];
                if (!note.alive || note.judged) continue;

                const score = calcJudgeScore(note.moving.x - note.targetX);
                if (score > 0) {
                    note.pendingScore = score;
                    note.judged = true;
                }
            }
        });

        NOTE_TIMINGS.forEach((timing) => {
            scene.setTimeout(() => {
                spawnNote();
            }, timing);
        });

        const timer = scene.setInterval(() => {
            remainingTime--;

            if (remainingTime === 0) {
                scene.clearInterval(timer);

                scene.setTimeout(() => {
                    game.replaceScene(endingScene);
                }, ENDING_DELAY);
            }

            updateTimerLabel();
        }, 1000);
    });
};