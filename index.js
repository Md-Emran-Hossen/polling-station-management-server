const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const express = require("express");
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require("path");

 const helmet = require("helmet");
 const cors = require("cors");
 require("dotenv").config();
 
 const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

 const app = express();

 app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],       // server scripts, images, fonts
      scriptSrc: ["'self'"],        // scripts
      styleSrc: ["'self'", "'unsafe-inline'"], // styles
      imgSrc: ["'self'", "data:"],  // images
      connectSrc: ["'self'"],       // allow fetch/XHR/DevTools
    },
  })
);

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.json({});
});

// Handle CSP (Content Security Policy)
// app.use((req, res, next) => {
//   res.setHeader("Content-Security-Policy", "default-src 'self'; connect-src 'self' http://localhost:5000;");
//   next();
// });

 const port = process.env.PORT || 5000;

 app.use(cors());
 app.use(express.json());

 //DB User: polling_station_db_user
 //DB Pass: VWBWydTDxADFrwFc
 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_SECRET}@cluster0.ikm2v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// "mongodb+srv://polling_station_db_user:VWBWydTDxADFrwFc@cluster0.ikm2v.mongodb.net/?appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

   await client.connect();
   
    // Send a ping to confirm a successful connection

    const districtCollection = client.db("pollingStation").collection("districts");
    const upazilaCollection = client.db("pollingStation").collection("upazilas");
    const unionCollection = client.db("pollingStation").collection("unions");
    const pollingStationCollection = client.db("pollingStation").collection("pollingStations");
    const summaryCollection = client.db("pollingStation").collection("summaryInformations");
    const psCollection = client.db("pollingStation").collection("prisidingOfficers");

    const armyCollection = client.db("pollingStation").collection("armys");
    const bgbCollection = client.db("pollingStation").collection("bgbs");
    const policeCollection = client.db("pollingStation").collection("polices");
    const rabCollection = client.db("pollingStation").collection("rabs");
    const magistrateCollection = client.db("pollingStation").collection("magistrates");
    const mapCollection = client.db("pollingStation").collection("maps");
    const contactCollection = client.db("pollingStation").collection("contacts");
    const voteDataCollection = client.db("pollingStation").collection("voteCenterData");

  
    // remote server for file upload
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
 
 // Multer setup for temporary disk storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({ storage: storage });

  app.post("/api/upload-excel", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const filePath = req.file.path;
    try {
      // 1. Upload file to Cloudinary
      // Use resource_type: "raw" for non-image files like xlsx
      const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
        resource_type: "raw",
        folder: "excel_uploads",
      });

      console.log("File uploaded to Cloudinary:", cloudinaryResponse.url);

      // 2. Parse the Excel file data
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      if (jsonData.length > 0) {
        const insertResult = await voteDataCollection.insertMany(jsonData);
        console.log(`${insertResult.insertedCount} documents inserted into MongoDB`);
      }

      // 4. Clean up the temporary local file
      fs.unlinkSync(filePath);

      res.status(200).json({
        message: "File uploaded and data saved successfully!",
        cloudinaryUrl: cloudinaryResponse.url,
        insertedCount: jsonData.length,
      });

    } catch (error) {
      console.error("Error processing file:", error);
      // Clean up the local file in case of an error
      if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
      }
      res.status(500).send("Error processing file.");
    }
  });

 
    //<--- Configure multer for file storage within projects folder--->

    // const storage = multer.diskStorage({
    // destination: (req, file, cb) => {
    // cb(null, './uploads'); // Files will be saved in the 'uploads' directory
    // },
    // filename: (req, file, cb) => {
    //   cb(null, file.originalname);
    //   }
    // });

    // const upload = multer({ storage: storage });

  // API endpoint to handle file upload and data import
  // app.post('/api/upload-excel', upload.single('excelFile'), async (req, res) => {
  //   console.log("FUNCTION CALLED");
  //     if (!req.file) {
  //       return res.status(400).send('No file uploaded.');
  //     }
  //     const filePath = req.file.path;
  //     try {
  //       // 1. Read the Excel file
  //       const workbook = xlsx.readFile(filePath);
  //       const sheetName = workbook.SheetNames[0];
  //       const sheet = workbook.Sheets[sheetName];
  //       // Convert sheet to JSON array
  //       const jsonData = xlsx.utils.sheet_to_json(sheet);

  //       // 3. Insert the JSON data into the collection
  //       if (jsonData.length > 0) {
  //         const insertResult = await voteDataCollection.insertMany(jsonData);
  //         console.log(`${insertResult.insertedCount} documents inserted`);
  //         // Optional: remove the file after import
  //          fs.unlinkSync(filePath); 
  //         res.status(200).json({ message: 'Data imported successfully', count: insertResult.insertedCount });
  //       } else {
  //         res.status(400).json({ message: 'No data found in the Excel file' });
  //       }
  //     } catch (error) {
  //       console.error('Error during import:', error);
  //       res.status(500).json({ message: 'Error importing data', error: error.message });
  //     } finally {
  //       // 4. Close the MongoDB connection
  //       // await client.close();
  //     }
  //   });

    app.get("/file", async (req, res) => {
        const query = voteDataCollection.find();
        const result = await query.toArray();
        res.send(result);
      });
    app.delete("/file/data/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await voteDataCollection.deleteOne(query);
        res.send(result);
      });
      // filter by selected Upazila
      app.get("/file/data/upazila/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await voteDataCollection.find(Query).toArray();
           res.send(Result);
      });

      // filter by selected union
      app.get("/file/data/union/:id", async (req, res) => {
        const id = req.params.id;
           const Query = { unionID: id };
           const Result = await voteDataCollection.find(Query).toArray();
           res.send(Result);
      });
    app.put("/file/data/:id", async (req, res) => {
        const vId = req.params.id;
        const voteKendroInfo = req.body;
        const filter = { _id: new ObjectId(vId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
                  districtName: voteKendroInfo.districtName,
                  upazilaName: voteKendroInfo.upazilaName,
                  unionName: voteKendroInfo.unionName,
                  pollingStationNo: voteKendroInfo.pollingStationNo, 
                  pollingStationName: voteKendroInfo.pollingStationName, 
                  numberOfBooth: voteKendroInfo.numberOfBooth, 
                  wordNoAndVillage: voteKendroInfo.wordNoAndVillage,
                  pollingStationType: voteKendroInfo.pollingStationType,
                  pollingStationStatus: voteKendroInfo.pollingStationStatus,
                  pollingStationStatusText: voteKendroInfo.pollingStationStatusText,
                  permanentBooth: voteKendroInfo.permanentBooth,
                  temporaryBooth: voteKendroInfo.temporaryBooth,
                  male: voteKendroInfo.male,
                  female: voteKendroInfo.female,
                  thirdGender: voteKendroInfo.thirdGender,
                  totalVoter: voteKendroInfo.totalVoter,
                  parliamentarySeat: voteKendroInfo.parliamentarySeat,
                  mapInfo: voteKendroInfo.mapInfo,
                  prisidingOffcer: voteKendroInfo.prisidingOffcer,
                  mobile: voteKendroInfo.mobile,
                  subInspector : voteKendroInfo.subInspector,
                  siMobile : voteKendroInfo.siMobile,
          },
        };
        const result = await voteDataCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

    // Contacts route
    app.post("/contacts", async (req, res) => {
        const contactInfo = req.body;
        const result = await contactCollection.insertOne(contactInfo);
        res.send(result);
      });

      app.get("/contacts", async (req, res) => {
        const query = contactCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      // filter by selected Upazila
      app.get("/contacts/contact/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await contactCollection.find(Query).toArray();
           res.send(Result);
      });

      app.delete("/contact/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await contactCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/contact/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await contactCollection.findOne(query);
        res.send(result);
      });

       app.put("/contact/:id", async (req, res) => {
        const rId = req.params.id;
        const contactInfo = req.body;
        const filter = { _id: new ObjectId(rId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            contactPersonName: contactInfo.contactPersonName,
            designation: contactInfo.designation,
            mobile: contactInfo.mobile,
          },
        };

        const result = await contactCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

    // map route
    app.post("/maps", async (req, res) => {
        const mapInfo = req.body;
        const result = await mapCollection.insertOne(mapInfo);
        res.send(result);
      });

      app.get("/maps", async (req, res) => {
        const query = mapCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/map/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await mapCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/map/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await mapCollection.findOne(query);
        res.send(result);
      });

       // filter by selected Upazila
      app.get("/maps/map/:id", async (req, res) => {
          const id = req.params.id;
          const Query = { upazilaID: id };
          const Result = await mapCollection.find(Query).toArray();
          res.send(Result);
      });

      app.put("/map/:id", async (req, res) => {
        const mId = req.params.id;
        const mapInfo = req.body;
        const filter = { _id: new ObjectId(mId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            mapLink: mapInfo.mapLink,
          },
        };
        const result = await mapCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

   // magistrate route
    app.post("/magistrates", async (req, res) => {
        const magistrateInfo = req.body;
        const result = await magistrateCollection.insertOne(magistrateInfo);
        res.send(result);
      });

      app.get("/magistrates", async (req, res) => {
        const query = magistrateCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

       // filter by selected Upazila
      app.get("/magistrates/magistrate/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await magistrateCollection.find(Query).toArray();
           res.send(Result);
      });

      app.delete("/magistrate/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await magistrateCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/magistrate/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await magistrateCollection.findOne(query);
        res.send(result);
      });

       app.put("/magistrate/:id", async (req, res) => {
        const mId = req.params.id;
        const magistrateInfo = req.body;
        const filter = { _id: new ObjectId(mId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            magistrateName: magistrateInfo.magistrateName,
            designation: magistrateInfo.designation,
            mobile: magistrateInfo.mobile,
            pollingStations: magistrateInfo.pollingStations,
            liveLink: magistrateInfo.liveLink,
          },
        };

        const result = await magistrateCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

      // update live location
      app.put("/update/magistrate/:id", async (req, res) => {
        const mId = req.params.id;
        const liveLocationInfo = req.body;
        const filter = { _id: new ObjectId(mId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            liveLink: liveLocationInfo.liveLink,
          },
        };

        const result = await magistrateCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

     // RAB route
    app.post("/rabs", async (req, res) => {
        const rabInfo = req.body;
        const result = await rabCollection.insertOne(rabInfo);
        res.send(result);
      });

      app.get("/rabs", async (req, res) => {
        const query = rabCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      // filter by selected Upazila
      app.get("/rabs/rab/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await rabCollection.find(Query).toArray();
           res.send(Result);
      });

      app.delete("/rab/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await rabCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/rab/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await rabCollection.findOne(query);
        res.send(result);
      });

       app.put("/rab/:id", async (req, res) => {
        const rId = req.params.id;
        const rabInfo = req.body;
        const filter = { _id: new ObjectId(rId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            rabName: rabInfo.rabName,
            designation: rabInfo.designation,
            mobile: rabInfo.mobile,
          },
        };

        const result = await rabCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

    // Police route
     app.post("/polices", async (req, res) => {
        const policeInfo = req.body;
        const result = await policeCollection.insertOne(policeInfo);
        res.send(result);
      });

      app.get("/polices", async (req, res) => {
        const query = policeCollection.find();
        const result = await query.toArray();
        res.send(result);
      });
       // filter by selected Upazila
      app.get("/polices/police/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await policeCollection.find(Query).toArray();
           res.send(Result);
      });

      app.delete("/police/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await policeCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/police/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await policeCollection.findOne(query);
        res.send(result);
      });

       app.put("/police/:id", async (req, res) => {
        const pId = req.params.id;
        const policeInfo = req.body;
        const filter = { _id: new ObjectId(pId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            policeName: policeInfo.policeName,
            designation: policeInfo.designation,
            mobile: policeInfo.mobile,
          },
        };

        const result = await policeCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

    // BGB route
    app.post("/bgbs", async (req, res) => {
        const bgbInfo = req.body;
        const result = await bgbCollection.insertOne(bgbInfo);
        res.send(result);
      });

      app.get("/bgbs", async (req, res) => {
        const query = bgbCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

       // filter by selected Upazila
      app.get("/bgbs/bgb/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await bgbCollection.find(Query).toArray();
           res.send(Result);
      });

      app.delete("/bgb/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bgbCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/bgb/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bgbCollection.findOne(query);
        res.send(result);
      });

       app.put("/bgb/:id", async (req, res) => {
        const bId = req.params.id;
        const bgbInfo = req.body;
        const filter = { _id: new ObjectId(bId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            bgbName: bgbInfo.bgbName,
            designation: bgbInfo.designation,
            mobile: bgbInfo.mobile,
          },
        };

        const result = await bgbCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

    // Army route
    app.post("/armys", async (req, res) => {
        const armys = req.body;
        const result = await armyCollection.insertOne(armys);
        res.send(result);
      });

      app.get("/armys", async (req, res) => {
        const query = armyCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

       // filter by selected Upazila
      app.get("/armys/army/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await armyCollection.find(Query).toArray();
           res.send(Result);
      });

      app.delete("/army/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await armyCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/army/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await armyCollection.findOne(query);
        res.send(result);
      });

       app.put("/army/:id", async (req, res) => {
        const aId = req.params.id;
        const armyInfo = req.body;
        const filter = { _id: new ObjectId(aId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            armyName: armyInfo.armyName,
            designation: armyInfo.designation,
            mobile: armyInfo.mobile,
          },
        };

        const result = await armyCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

      // district route
      app.post("/districts", async (req, res) => {
        const districts = req.body;
         console.log("District Info: ", districts);
        const result = await districtCollection.insertOne(districts);
     //   console.log("District Info: ", result);
        res.send(result);
      });

      app.get("/districts", async (req, res) => {
        const query = districtCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/district/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await districtCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/district/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await districtCollection.findOne(query);
        res.send(result);
      });

       app.put("/district/:id", async (req, res) => {
        const dId = req.params.id;
        console.log("Update Data Found",dId);
        const district = req.body;
        const filter = { _id: new ObjectId(dId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            districtName: district.districtName,
            description: district.description,
          },
        };

        const result = await districtCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

      // Upazila Route

       app.post("/upazilas", async (req, res) => {
        const upazilas = req.body;
         console.log("Upazila Info: ", upazilas);
        const result = await upazilaCollection.insertOne(upazilas);
        console.log("Upazila Info: ", result);
        res.send(result);
      });

      app.get("/upazilas", async (req, res) => {
        const query = upazilaCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/upazila/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await upazilaCollection.deleteOne(query);
        res.send(result);
      });

    app.get("/loadUpazila/:id", async (req, res) => {
        const id = req.params.id;
        // console.log("UPAZILA DATA FUNCTION CALL");
        const query = { districtID: id };
        const result = await upazilaCollection.find(query).toArray();;
        res.send(result);
      });

      app.get("/loadUnion/:id", async (req, res) => {
        const id = req.params.id;
        console.log("UNION DATA FUNCTION CALL", id);
        const query = { upazilaID: id };
        const result = await unionCollection.find(query).toArray();;
        res.send(result);
      });

      app.get("/upazila/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await upazilaCollection.findOne(query);
        res.send(result);
      });

       app.put("/upazila/:id", async (req, res) => {
        const uId = req.params.id;
        const upazila = req.body;
        const filter = { _id: new ObjectId(uId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            upazilaName: upazila.upazilaName,
          },
        };
        const result = await upazilaCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

      // Union Route

       app.post("/unions", async (req, res) => {
        const unionData = req.body;
        const result = await unionCollection.insertOne(unionData);
        res.send(result);
      });

      app.get("/unions", async (req, res) => {
        const query = unionCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/union/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await unionCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/union/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await unionCollection.findOne(query);
        res.send(result);
      });

       app.put("/union/:id", async (req, res) => {
        const uId = req.params.id;
        console.log("Update Data Found",uId);
        const union = req.body;
        const filter = { _id: new ObjectId(uId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            unionName: union.unionName,
          },
        };

        const result = await unionCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

       // Polling Station Route

      app.post("/pollingStations", async (req, res) => {
        const pollingStationData = req.body;
        const result = await pollingStationCollection.insertOne(pollingStationData);
        res.send(result);
      });

      app.get("/pollingStations", async (req, res) => {
        const query = pollingStationCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

     // fetch data from join collections 
      app.get("/aggregated-pollingStations", async (req, res) => {
              try {
            // const ordersCollection = db.collection('orders');

            const pipeline = [
              {
                $lookup: {
                  from: 'unions', // The foreign collection name
                  let: { unionIdString: '$unionID' }, // Define a variable from the local field (string type)
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // Convert the local string variable to ObjectId for matching with foreign _id (ObjectId type)
                          $eq: ['$_id', { $toObjectId: '$$unionIdString' }]
                        }
                      }
                    }
                  ],
                  as: 'pollingStationDetails' // Name of the new array field with joined data
                }
              },
              {
                $unwind: {
                  path: '$pollingStationDetails', // Deconstruct the array field
                  preserveNullAndEmptyArrays: true // Optional: keeps documents if no match is found
                }
              },
            ];

            const aggregatedPollingStations = await pollingStationCollection.aggregate(pipeline).toArray();

            res.status(200).json(aggregatedPollingStations);
          } catch (error) {
            console.error(error);
            res.status(500).send('Error aggregating data');
          }
        });

      app.delete("/pollingStation/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await pollingStationCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/pollingStation/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await pollingStationCollection.findOne(query);
        res.send(result);
      });

       app.get("/pollingStations/pollingStation/:id", async (req, res) => {
        const id = req.params.id;
           const Query = { districtID: id };
           const Result = await pollingStationCollection.find(Query).toArray();
           res.send(Result);
      });

      // filter by selected Upazila
      app.get("/pollingStations/pollingStation/upazila/:id", async (req, res) => {
          const id = req.params.id;
           const Query = { upazilaID: id };
           const Result = await pollingStationCollection.find(Query).toArray();
           res.send(Result);
      });

      // filter by selected union
      app.get("/pollingStations/pollingStation/union/:id", async (req, res) => {
        const id = req.params.id;
           const Query = { unionID: id };
           const Result = await pollingStationCollection.find(Query).toArray();
           res.send(Result);
      });

       app.put("/pollingStation/:id", async (req, res) => {
        const psId = req.params.id;
        const pollingStation = req.body;
        const filter = { _id: new ObjectId(psId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
                  districtName: pollingStation.districtName,
                  upazilaName: pollingStation.upazilaName,
                  unionName: pollingStation.unionName,
                  pollingStationNo: pollingStation.pollingStationNo, 
                  pollingStationName: pollingStation.pollingStationName, 
                  numberOfBooth: pollingStation.numberOfBooth, 
                  wordNoAndVillage: pollingStation.wordNoAndVillage,
                  pollingStationType: pollingStation.pollingStationType,
                  permanentBooth: pollingStation.permanentBooth,
                  temporaryBooth: pollingStation.temporaryBooth,
                  male: pollingStation.male,
                  female: pollingStation.female,
                  thirdGender: pollingStation.thirdGender,
                  totalVoter: pollingStation.totalVoter,
                  parliamentarySeat: pollingStation.parliamentarySeat,
                  mapInfo: pollingStation.mapInfo,
                  prisidingOffcer: pollingStation.prisidingOffcer,
                  mobile: pollingStation.mobile,
                  subInspector : pollingStation.subInspector,
                  siMobile : pollingStation.siMobile,
          },
        };
        const result = await pollingStationCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

       // Summary Route

       app.post("/summaryInformations", async (req, res) => {
        const summaryData = req.body;
        const result = await summaryCollection.insertOne(summaryData);
        // console.log("Summary Data: ", result);
        res.send(result);
      });

      app.get("/summaryInformations", async (req, res) => {
        const query = summaryCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/summaryInformation/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await summaryCollection.deleteOne(query);
        res.send(result);
      });
  
      app.get("/summaryInformation/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await summaryCollection.findOne(query);
        res.send(result);
      });

      app.get("/summaryInformations/summaryInformation/:id", async (req, res) => {
        const id = req.params.id;
        console.log("ID FOUND:", id);
           const Query = { upazilaID: id };
           const Result = await summaryCollection.find(Query).toArray();
           res.send(Result);
      });

       app.put("/summaryInformation/:id", async (req, res) => {
        const sId = req.params.id;
        const summaryInfo = req.body;
        const filter = { _id: new ObjectId(sId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            upazilaName: summaryInfo.upazilaName,
            numberOfUnion: summaryInfo.numberOfUnion,
            numberOfPourosova: summaryInfo.numberOfPourosova,
            permanentPollingStation: summaryInfo.permanentPollingStation,
            temporaryPollingStation: summaryInfo.temporaryPollingStation,
            totalPollingStation: summaryInfo.totalPollingStation,
            permanentBooth: summaryInfo.permanentBooth,
            temporaryBooth: summaryInfo.temporaryBooth,
            totalBooth: summaryInfo.totalBooth,
            maleVoter: summaryInfo.maleVoter,
            femaleVoter: summaryInfo.femaleVoter,
            thirdGender: summaryInfo.thirdGender,
            totalVoter: summaryInfo.totalVoter,
            comments: summaryInfo.comments,
          },
        };

        const result = await summaryCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

      app.post("/prisidingOfficers", async (req, res) => {
        const psOfficer = req.body;
        const result = await psCollection.insertOne(psOfficer);
        res.send(result);
      });

      app.get("/prisidingOfficers", async (req, res) => {
        const query = psCollection.find();
        const result = await query.toArray();
        res.send(result);
      });

      app.delete("/prisidingOfficer/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await psCollection.deleteOne(query);
        res.send(result);
      });

       app.put("/prisidingOfficer/:id", async (req, res) => {
        const psoId = req.params.id;
        const psoInfo = req.body;
        const filter = { _id: new ObjectId(psoId) };
        const option = { upsert: true };
        
        const updatedData = {
          $set: {
            prisidingOffcer: psoInfo.prisidingOffcer,
            mobile: psoInfo.mobile,
          },
        };
        const result = await districtCollection.updateOne(
          filter,
          updatedData,
          option
        );
        res.send(result);
      });

   await client.db("admin").command({ ping: 1 });
   console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  //  await client.close();
  }
}
run().catch((error)=>{
    console.log(error);
});

 app.get('/',(req, res)=>{
    res.send("Polling Station Management Server is Running!");
 });

 app.listen(port, ()=>{
    console.log(`Polling Station Management Server is Running on ${port}`);
 })