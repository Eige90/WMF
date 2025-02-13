document.addEventListener('DOMContentLoaded', () => {
    const gpsData = [];
    const socket = new WebSocket('ws://your-arduino-ip-address');

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'gps') {
            gpsData.push({ latitude: data.latitude, longitude: data.longitude, timestamp: Date.now() });
            console.log('GPS Data received:', data);
        }
    });

    function saveGpsData() {
        const blob = new Blob([JSON.stringify(gpsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gps_data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save GPS Data';
    saveButton.style.position = 'fixed';
    saveButton.style.top = '320px';
    saveButton.style.right = '100px';
    saveButton.style.zIndex = '100';
    saveButton.style.padding = '20px';
    document.body.appendChild(saveButton);

    saveButton.addEventListener('click', saveGpsData);
});
