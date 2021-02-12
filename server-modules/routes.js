//server modules
const registrationPromise = require("./registration-promise");
const useragent = require("express-useragent");

module.exports = (app, MapStashModel) => {
  console.log("exported mapmaker");
  //mount useragent
  app.use(useragent.express());
  //CLIENT REQUEST FOR MAP MAKER PAGE
  app.get("/mapmaker", (req, res) => {
    console.log("MAPMAKER!");
    if (!req.useragent.isDesktop) {
      res.send(`<head><meta name="viewport", content="width=device-width, initial-scale=1.0, maximum-scale = 1.0, user-scalable=no"></head>
          <h3>Sorry! Our mapMaker is not yet compatible with mobile.. :(</h3>
          <a href='/'>Back to game page</a>
          `);
    } else if (req.useragent.isFirefox) {
      res.send(
        `<h3>Sorry, our app doesn't run well on Firefox.</h3>
          <p>Because Firefox doesn't support canvas transferring and webm which our app is using,
          consider downloading other browser which supports it instead?</p>
          <ul>
          <li>Recommended: <a href='https://www.google.com/chrome/?brand=CHBD&gclid=CjwKCAjwnIr1BRAWEiwA6GpwNW3mAOe44k8Gt7bs_R45kW3AwTYZxt3FOD3wFnutclgrv5Rcn4XlghoCc4sQAvD_BwE&gclsrc=aw.ds'>Chrome</a></li>
          <li>Recommended: <a href='https://brave.com/?ref=cra598'>Brave</a></li>
          <li><a href='https://www.opera.com/'>Opera</a></li>
          </ul>`
      );
    } else {
      res.render("../dist/index.pug");
    }
  });

  //CREATE STASH
  app.post("/mapmaker/createstash", (req, res) => {
    let retries = 0;

    const mapstashname = req.body.toLowerCase();

    callThisToAttemptSave();
    function callThisToAttemptSave() {
      registrationPromise({
        Model: MapStashModel,
        ref: "mapStashNames",
        value: mapstashname,
      })
        .then(() => {
          const uuid = uuidv4();
          const newDoc = new MapStashModel({
            mapStashName: mapstashname,
            key: uuid,
            maps: { "": "" },
          });

          //mapStashNames only used for set reference entry
          newDoc.mapStashNames = undefined;
          newDoc.save((e, save) => {
            if (e) {
              res.json({
                type: "error",
                message:
                  "Error during saving data USER LEVEL, please try again. Error message: " +
                  e,
              });
            } else if (!save) {
              res.json({
                type: "error",
                message: "Failed to save data, please try again.",
              });
            } else {
              res.json({
                type: "success",
                message: `New stash "${mapstashname}" created.
                  Please save this KEY:`,
                val: uuid,
              });
            }
          });
        })
        .catch((data) => {
          console.log(data.message);
          const reg = /VersionError/g;
          if (reg.test(data.message)) {
            if (retries <= 7) {
              retries++;
              callThisToAttemptSave();
            } else {
              res.json({
                type: "error",
                message: "Server busy, please try again. Retries: " + retries,
              });
            }
          } else {
            res.json(data);
          }
        });
    }
  });

  //OPEN STASH
  app.post("/mapmaker/openstash", (req, res) => {
    const mapstashname = req.body.stashName.toLowerCase();
    const mapstashkey = req.body.stashKey;

    MapStashModel.findOne({ mapStashName: mapstashname }, (err, doc) => {
      if (err) return res.json({ type: "error", message: err });
      if (!doc)
        return res.json({
          type: "error",
          message: "Stash name doesn't exist",
        });

      if (doc.key != mapstashkey)
        return res.json({ type: "error", message: "Invalid key" });

      res.json({
        type: "success",
        message: { mapStashName: doc.mapStashName, maps: doc.maps },
      });
    });
  });

  //SAVE STASH
  app.post("/mapmaker/savestash", (req, res) => {
    MapStashModel.findOne(
      { mapStashName: req.body.mapStashName },
      (err, doc) => {
        if (err) return res.json({ type: "error", message: err });
        if (!doc)
          return res.json({
            type: "error",
            message: "Stash name doesn't exist",
          });

        doc.maps[req.body.mapName] = req.body.mapData;
        doc.markModified("maps");
        doc.save((err) => {
          if (err) return res.json({ type: "error", message: err });
          res.json({
            type: "success",
            message: { mapStashName: doc.mapStashName, maps: doc.maps },
          });
        });
      }
    );
  });
};
