const mongoose = require("mongoose");

const uri =
  "mongodb+srv://kumarsamit0325_db_user:54M14kumar2006@cluster0.0ewuxzh.mongodb.net/watchTogether?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(uri)
  .then(() => {
    console.log("✅ Connected successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });