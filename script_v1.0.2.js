document.addEventListener('DOMContentLoaded', () => {
    const redRectangle = document.getElementById('red-rectangle');
    const greenRectangle = document.createElement('div');
    greenRectangle.id = 'green-rectangle';
    document.getElementById('container').appendChild(greenRectangle);
    const container = document.getElementById('container');
    const centerObject = document.getElementById('center-object');
    const secondObject = document.getElementById('second-object');
    const toggleButton = document.getElementById('toggle-button');
    const step = 15; // 60cm in pixels
    const triangleWidth = 30; // 60cm in pixels
    const triangleHeight = 30; // 60cm in pixels
    let angle = 0;
    let isGreen = false;
    let position = { top: `${container.clientHeight - 30}px`, left: '0px' };
    const mowedPositions = new Set();
    let collisionDetected = false;

    // WebSocket-Verbindung zum Arduino
    const socket = new WebSocket('ws://your-arduino-ip-address');

    // Startposition des Pfeils unten links
    redRectangle.style.top = position.top;
    redRectangle.style.left = position.left;
    greenRectangle.style.top = position.top;
    greenRectangle.style.left = position.left;

    // Update the position of the obstacles
    centerObject.style.top = '20%'; // Change this value to move the first obstacle vertically
    centerObject.style.left = '20%'; // Change this value to move the first obstacle horizontally
    secondObject.style.top = '50%'; // Change this value to move the second obstacle vertically
    secondObject.style.left = '50%'; // Change this value to move the second obstacle horizontally

    toggleButton.addEventListener('click', () => {
        toggleGreenRobot();
    });

    function toggleGreenRobot() {
        isGreen = !isGreen;
        redRectangle.style.display = isGreen ? 'none' : 'block';
        greenRectangle.style.display = isGreen ? 'block' : 'none';

        // Position beibehalten
        if (isGreen) {
            greenRectangle.style.top = redRectangle.style.top;
            greenRectangle.style.left = redRectangle.style.left;
            greenRectangle.style.transform = redRectangle.style.transform;
            position.top = greenRectangle.style.top;
            position.left = greenRectangle.style.left;
            socket.send(JSON.stringify({ motor: 'third-on' }));
        } else {
            redRectangle.style.top = greenRectangle.style.top;
            redRectangle.style.left = greenRectangle.style.left;
            redRectangle.style.transform = greenRectangle.style.transform;
            position.top = redRectangle.style.top;
            position.left = redRectangle.style.left;
            socket.send(JSON.stringify({ motor: 'third-off' }));
        }

        // Abgemähte Fläche sofort anzeigen
        if (isGreen) {
            updateMowedArea();
        }
    }

    function updateMowedArea() {
        const activeRectangle = isGreen ? greenRectangle : redRectangle;
        const rect = activeRectangle.getBoundingClientRect();
        const top = parseFloat(activeRectangle.style.top) || 0;
        const left = parseFloat(activeRectangle.style.left) || 0;
        const centerX = left + triangleWidth / 2;
        const centerY = top + triangleHeight / 2;
        const x = centerX - (triangleHeight / 2) * Math.cos(angle * Math.PI / 180);
        const y = centerY - (triangleHeight / 2) * Math.sin(angle * Math.PI / 180);
        const positionKey = `${x},${y}`;
        if (!mowedPositions.has(positionKey)) {
            mowedPositions.add(positionKey);
            const mowedArea = document.createElement('div');
            mowedArea.className = 'mowed-area';
            mowedArea.style.width = `${triangleWidth}px`;
            mowedArea.style.height = `${triangleHeight}px`;
            mowedArea.style.top = `${y - triangleHeight / 2}px`; // Positioniere die abgemähte Fläche zentriert hinter dem Dreieck
            mowedArea.style.left = `${x - triangleWidth / 2}px`; // Positioniere die abgemähte Fläche zentriert hinter dem Dreieck
            container.appendChild(mowedArea);
        }
    }

    document.addEventListener('keydown', (event) => {
        if (collisionDetected) return; // Bewegung stoppen, wenn Kollision erkannt wurde

        const activeRectangle = isGreen ? greenRectangle : redRectangle;
        const rect = activeRectangle.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const centerRect = centerObject.getBoundingClientRect();
        const secondRect = secondObject.getBoundingClientRect();
        let top = parseFloat(activeRectangle.style.top) || 0;
        let left = parseFloat(activeRectangle.style.left) || 0;

        switch (event.key) {
            case 'ArrowUp':
                top -= step * Math.cos(angle * Math.PI / 180);
                left += step * Math.sin(angle * Math.PI / 180);
                socket.send(JSON.stringify({ motor: 'left-on' }));
                socket.send(JSON.stringify({ motor: 'right-on' }));
                break;
            case 'ArrowDown':
                top += step * Math.cos(angle * Math.PI / 180);
                left -= step * Math.sin(angle * Math.PI / 180);
                socket.send(JSON.stringify({ motor: 'left-on' }));
                socket.send(JSON.stringify({ motor: 'right-on' }));
                break;
            case 'ArrowLeft':
                angle -= 5; // Rotate by 5 degrees
                activeRectangle.style.transform = `rotate(${angle}deg)`;
                socket.send(JSON.stringify({ motor: 'left-off' }));
                socket.send(JSON.stringify({ motor: 'right-on' }));
                break;
            case 'ArrowRight':
                angle += 5; // Rotate by 5 degrees
                activeRectangle.style.transform = `rotate(${angle}deg)`;
                socket.send(JSON.stringify({ motor: 'left-on' }));
                socket.send(JSON.stringify({ motor: 'right-off' }));
                break;
        }

        // Begrenzungen prüfen
        if (top < 0) top = 0;
        if (left < 0) left = 0;
        if (top > containerRect.height - rect.height) top = containerRect.height - rect.height;
        if (left > containerRect.width - rect.width) left = containerRect.width - rect.width;

        activeRectangle.style.top = `${top}px`;
        activeRectangle.style.left = `${left}px`;

        // Position speichern
        position.top = activeRectangle.style.top;
        position.left = activeRectangle.style.left;

        // Kollisionserkennung
        if (
            (rect.left < centerRect.right &&
            rect.right > centerRect.left &&
            rect.top < centerRect.bottom &&
            rect.bottom > centerRect.top) ||
            (rect.left < secondRect.right &&
            rect.right > secondRect.left &&
            rect.top < secondRect.bottom &&
            rect.bottom > secondRect.top)
        ) {
            // Schalte sofort alle Motoren aus
            socket.send(JSON.stringify({ motor: 'third-off' }));
            socket.send(JSON.stringify({ motor: 'left-off' }));
            socket.send(JSON.stringify({ motor: 'right-off' }));
            
            // Zeige sofort das rote Dreieck an und deaktiviere weitere Steuerung
            redRectangle.style.display = 'block';
            greenRectangle.style.display = 'none';
            isGreen = false;
            collisionDetected = true;
            toggleButton.disabled = true; // Deaktiviert den Toggle-Button

            // UI-Aktualisierung sicherstellen und dann den Alert auslösen
            setTimeout(() => {
                alert('COLLISION - Alle Steuerungen sind deaktiviert.');
            }, 0);
            
            return; // Stoppe weitere Bewegungen
        }

        // Farbe ändern (gemäht) nur wenn grün
        if (isGreen) {
            updateMowedArea();
        }
    });

    document.addEventListener('keyup', (event) => {
        if (collisionDetected) return; // Bewegung stoppen, wenn