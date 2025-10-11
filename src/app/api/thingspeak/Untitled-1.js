const thingSpeakChannel = { "channel": { "id":3110372, "name":"VASUDHA 1", "description":"SOIL PARAMETERS", "field1":"SOIL NITROGEN", "field2":"SOIL PH", "field3":"SOIL POTASSIUM", "field4":"SOIL TEMPERATURE", "field5":"SOIL MOISTURE", "field6":"SOIL EC", "field7":"SOIL HUMIDITY", "created_at":"2025-10-10T17:42:09Z" } };

const res = await fetch('/api/thingspeak', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(thingSpeakChannel)
});
const json = await res.json();
console.log(json);