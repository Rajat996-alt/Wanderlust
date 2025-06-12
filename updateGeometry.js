require("dotenv").config(); // Load environment variables first

const mongoose = require("mongoose");
const Listing = require("./models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapBoxToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapBoxToken });

mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");

(async () => {
  try {
    const listings = await Listing.find({
      "geometry.coordinates": { $size: 0 },
    });
    console.log(`📌 Found ${listings.length} listings with empty geometry.`);

    for (let listing of listings) {
      const query = `${listing.location}, ${listing.country}`;
      let response = await geocodingClient
        .forwardGeocode({
          query: query,
          limit: 1,
        })
        .send();

      if (response.body.features.length) {
        listing.geometry = response.body.features[0].geometry;
        await listing.save();
        console.log(`✅ Updated: ${listing.title}`);
      } else {
        console.log(`❌ Could not find location for: ${listing.title}`);
      }
    }
  } catch (err) {
    console.error("❌ Error occurred:", err);
  } finally {
    mongoose.connection.close();
  }
})();
