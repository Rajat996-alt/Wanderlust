const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist.");
    return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing });
};

module.exports.createNewListing = async (req, res, next) => {
  const locationQuery = `${req.body.listing.location}, ${req.body.listing.country}`;

  let response = await geocodingClient
    .forwardGeocode({
      query: locationQuery,
      limit: 1,
    })
    .send();

  if (!response.body.features.length) {
    req.flash(
      "error",
      "Could not find location. Try again with a valid location."
    );
    return res.redirect("/listings/new");
  }

  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  newListing.geometry = response.body.features[0].geometry;
  let savedListing = await newListing.save();
  console.log(savedListing);

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist.");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body.listing;

  // If location or country has changed, re-geocode
  const locationQuery = `${updatedData.location}, ${updatedData.country}`;

  let response = await geocodingClient
    .forwardGeocode({
      query: locationQuery,
      limit: 1,
    })
    .send();

  if (!response.body.features.length) {
    req.flash("error", "Could not find updated location. Try again.");
    return res.redirect(`/listings/${id}/edit`);
  }

  const listing = await Listing.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: true,
  });

  // Update geometry from Mapbox result
  listing.geometry = response.body.features[0].geometry;

  // If new image was uploaded
  if (typeof req.file !== "undefined") {
    const url = req.file.path;
    const filename = req.file.filename;
    listing.image = { url, filename };
  }

  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
