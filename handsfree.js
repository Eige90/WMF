document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const centerObject = document.getElementById('center-object');
    const centerRect = centerObject.getBoundingClientRect();
  
    // Gemeinsame Parameter
    const stepDistance = 10; // Pixel pro Iteration
    const stepInterval = 1; // ms (100x faster)
  
    // ------- AREA MOW Modus (angepasst) -------
    function generateMowingSequence() {
        return [
            { key: 'ArrowUp', distance: 100 },
            { key: 'ArrowRight', distance: 0, rotate: 90 },
        ];
    }
  
    let areaMowActive = false;
    let areaMowSequence = [];
    let areaMowStep = 0;
    let angle = 0; // Initialize angle
  
    function runAreaMowStep() {
        if (!areaMowActive || areaMowStep >= areaMowSequence.length) return;
        const step = areaMowSequence[areaMowStep];
        let remaining = step.distance;
        function move() {
            if (remaining <= 0) {
                if (step.rotate) {
                    const rotateStep = 5; // Rotate by 5 degrees each step
                    const rotateInterval = 100; // ms
                    const totalSteps = step.rotate / rotateStep;
                    let currentStep = 0;
                    function rotate() {
                        if (currentStep >= totalSteps) {
                            areaMowStep++;
                            runAreaMowStep();
                            return;
                        }
                        angle += rotateStep;
                        const keyDown = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                        document.dispatchEvent(keyDown);
                        setTimeout(() => {
                            const keyUp = new KeyboardEvent('keyup', { key: 'ArrowRight' });
                            document.dispatchEvent(keyUp);
                            currentStep++;
                            setTimeout(rotate, rotateInterval);
                        }, 50);
                    }
                    rotate();
                } else {
                    areaMowStep++;
                    runAreaMowStep();
                }
                return;
            }
            const keyDown = new KeyboardEvent('keydown', { key: step.key });
            document.dispatchEvent(keyDown);
            setTimeout(() => {
                const keyUp = new KeyboardEvent('keyup', { key: step.key });
                document.dispatchEvent(keyUp);
                remaining -= stepDistance;
                setTimeout(move, stepInterval);
            }, 50);
        }
        move();
    }
  
    // ------- UI: Button für den Area Mow Modus -------
    function createButton(id, label, topPos, handler) {
        const btn = document.createElement('button');
        btn.id = id;
        btn.textContent = label;
        btn.style.position = 'fixed';
        btn.style.top = `${topPos}px`;
        btn.style.right = '100px';
        btn.style.zIndex = '100';
        btn.style.padding = '20px';
        document.body.appendChild(btn);
        btn.addEventListener('click', handler);
    }
  
    createButton('handsfree-area', 'Area Mow', 100, () => {
        areaMowActive = true;
        areaMowSequence = generateMowingSequence();
        areaMowStep = 0;
        runAreaMowStep();
    });

    // ------- UI: Button für den Parcour Modus -------
    function generateParcourSequence() {
        const sequence = [];
        const containerSize = 500;
        const obstacleSize = 50;
        const margin = 10;
        const halfObstacle = obstacleSize / 2;
        const halfContainer = containerSize / 2;

        // Start from bottom-left corner
        let x = 0;
        let y = containerSize - stepDistance;

        // Move up to the top-left corner
        while (y > 0) {
            sequence.push({ key: 'ArrowUp', distance: stepDistance });
            y -= stepDistance;
        }

        // Move right to the top-right corner
        while (x < containerSize - stepDistance) {
            sequence.push({ key: 'ArrowRight', distance: stepDistance });
            x += stepDistance;
        }

        // Move down to the bottom-right corner
        while (y < containerSize - stepDistance) {
            sequence.push({ key: 'ArrowDown', distance: stepDistance });
            y += stepDistance;
        }

        // Move left to the bottom-left corner
        while (x > 0) {
            sequence.push({ key: 'ArrowLeft', distance: stepDistance });
            x -= stepDistance;
        }

        // Move up to the bottom of the obstacle
        while (y > halfContainer - halfObstacle - margin) {
            sequence.push({ key: 'ArrowUp', distance: stepDistance });
            y -= stepDistance;
        }

        // Move right to the right side of the obstacle
        while (x < halfContainer + halfObstacle + margin) {
            sequence.push({ key: 'ArrowRight', distance: stepDistance });
            x += stepDistance;
        }

        // Move up to the top of the obstacle
        while (y > halfContainer + halfObstacle + margin) {
            sequence.push({ key: 'ArrowUp', distance: stepDistance });
            y -= stepDistance;
        }

        // Move left to the left side of the obstacle
        while (x > halfContainer - halfObstacle - margin) {
            sequence.push({ key: 'ArrowLeft', distance: stepDistance });
            x -= stepDistance;
        }

        // Move up to the top-left corner
        while (y > 0) {
            sequence.push({ key: 'ArrowUp', distance: stepDistance });
            y -= stepDistance;
        }

        // Move right to the top-right corner
        while (x < containerSize - stepDistance) {
            sequence.push({ key: 'ArrowRight', distance: stepDistance });
            x += stepDistance;
        }

        // Move down to the bottom-right corner
        while (y < containerSize - stepDistance) {
            sequence.push({ key: 'ArrowDown', distance: stepDistance });
            y += stepDistance;
        }

        // Move left to the bottom-left corner
        while (x > 0) {
            sequence.push({ key: 'ArrowLeft', distance: stepDistance });
            x -= stepDistance;
        }

        return sequence;
    }

    let parcourActive = false;
    let parcourSequence = [];
    let parcourStep = 0;

    function runParcourStep() {
        if (!parcourActive || parcourStep >= parcourSequence.length) return;
        const step = parcourSequence[parcourStep];
        let remaining = step.distance;
        function move() {
            if (remaining <= 0) {
                parcourStep++;
                runParcourStep();
                return;
            }
            const keyDown = new KeyboardEvent('keydown', { key: step.key });
            document.dispatchEvent(keyDown);
            setTimeout(() => {
                const keyUp = new KeyboardEvent('keyup', { key: step.key });
                document.dispatchEvent(keyUp);
                remaining -= stepDistance;
                setTimeout(move, stepInterval);
            }, stepInterval);
        }
        move();
    }

    createButton('handsfree-parcour', 'Parcour', 200, () => {
        parcourActive = true;
        parcourSequence = generateParcourSequence();
        parcourStep = 0;
        runParcourStep();
    });
});
