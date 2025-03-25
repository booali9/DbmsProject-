const socket = io();

// Initialize the markers object
const markers = {};

// Initialize the map
const map = L.map("map").setView([0, 0], 2);

// Add the tile layer
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Ned University Engineering & Technology",
}).addTo(map);

// Geolocation
if (navigator.geolocation) {
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const role = "undergrad"; // Replace with the actual role of the logged-in user
      socket.emit("send-location", { latitude, longitude, role });

      // Update the map view with the user's current location
      map.setView([latitude, longitude], 15);
      if (!markers[socket.id]) {
        markers[socket.id] = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here!")
          .openPopup();
      } else {
        markers[socket.id].setLatLng([latitude, longitude]);
      }
    },
    (error) => {
      console.error("Error getting location:", error.message);
    },
    options
  );
} else {
  console.error("Geolocation is not supported by this browser.");
}

// Handle initial locations
socket.on("initial-locations", (locations) => {
  locations.forEach(([id, data]) => {
    const { latitude, longitude, role } = data;
    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`Role: ${role}`);
  });
});

// Handle received locations
socket.on("receive-location", (data) => {
  const { id, latitude, longitude, role } = data;
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`Role: ${role}`);
  }
});

// Handle user disconnection
socket.on("user-disconnect", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});