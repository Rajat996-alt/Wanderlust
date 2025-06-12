mapboxgl.accessToken = mapToken;

document.addEventListener("DOMContentLoaded", () => {
  if (
    !listing ||
    !listing.geometry ||
    !Array.isArray(listing.geometry.coordinates)
  ) {
    console.error("Invalid or missing listing geometry data.");
    return;
  }

  const coordinates = listing.geometry.coordinates;

  if (coordinates.length !== 2) {
    console.error("Invalid coordinates array:", coordinates);
    return;
  }

  const [lng, lat] = coordinates;

  const map = new mapboxgl.Map({
    container: "map", // ID of the HTML element
    style: "mapbox://styles/mapbox/streets-v12",
    center: [lng, lat], // Make sure it's [longitude, latitude]
    zoom: 9,
  });

  const marker = new mapboxgl.Marker({ color: "red" })
    .setLngLat([lng, lat])
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<h4>${listing.location}</h4><p>Exact location will be shared after booking</p>`
      )
    )
    .addTo(map);
});
