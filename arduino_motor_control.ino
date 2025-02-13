#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>

const char* ssid = "your-SSID";
const char* password = "your-PASSWORD";

WebSocketsServer webSocket = WebSocketsServer(81);
TinyGPSPlus gps;
SoftwareSerial ss(D4, D3); // RX, TX

const int leftMotorPin = D1; // Pin für den linken Motor
const int rightMotorPin = D2; // Pin für den rechten Motor
const int thirdMotorPin = D3; // Pin für den dritten Motor

void setup() {
    Serial.begin(115200);
    ss.begin(9600);
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }

    Serial.println("Connected to WiFi");
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);

    pinMode(leftMotorPin, OUTPUT);
    pinMode(rightMotorPin, OUTPUT);
    pinMode(thirdMotorPin, OUTPUT);
    digitalWrite(leftMotorPin, LOW); // Motoren aus
    digitalWrite(rightMotorPin, LOW); // Motoren aus
    digitalWrite(thirdMotorPin, LOW); // Dritter Motor aus
}

void loop() {
    webSocket.loop();
    while (ss.available() > 0) {
        gps.encode(ss.read());
        if (gps.location.isUpdated()) {
            String gpsData = "{\"type\":\"gps\",\"latitude\":" + String(gps.location.lat(), 6) + ",\"longitude\":" + String(gps.location.lng(), 6) + "}";
            webSocket.broadcastTXT(gpsData);
        }
    }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] Disconnected!\n", num);
            break;
        case WStype_CONNECTED:
            {
                IPAddress ip = webSocket.remoteIP(num);
                Serial.printf("[%u] Connected from %s\n", num, ip.toString().c_str());
            }
            break;
        case WStype_TEXT:
            Serial.printf("[%u] Received text: %s\n", num, payload);
            if (strcmp((char*)payload, "{\"motor\":\"left-on\"}") == 0) {
                digitalWrite(leftMotorPin, HIGH); // Linker Motor ein
            } else if (strcmp((char*)payload, "{\"motor\":\"left-off\"}") == 0) {
                digitalWrite(leftMotorPin, LOW); // Linker Motor aus
            } else if (strcmp((char*)payload, "{\"motor\":\"right-on\"}") == 0) {
                digitalWrite(rightMotorPin, HIGH); // Rechter Motor ein
            } else if (strcmp((char*)payload, "{\"motor\":\"right-off\"}") == 0) {
                digitalWrite(rightMotorPin, LOW); // Rechter Motor aus
            } else if (strcmp((char*)payload, "{\"motor\":\"third-on\"}") == 0) {
                digitalWrite(thirdMotorPin, HIGH); // Dritter Motor ein
            } else if (strcmp((char*)payload, "{\"motor\":\"third-off\"}") == 0) {
                digitalWrite(thirdMotorPin, LOW); // Dritter Motor aus
            }
            break;
    }
}
