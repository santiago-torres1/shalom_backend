const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.ACESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: 'us-east-2'
});

// Configure Multer for handling file uploads
const upload = multer({
  dest: 'uploads/' // Temporary directory for storing uploaded files
});

// Define route for uploading images
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const promises = req.files.map(async (file) => {
      const fileContent = fs.readFileSync(file.path);
      const params = {
        Bucket: 'shalomimgbucket',
        Key: 'product-imgs/' + file.originalname, // Use the original filename for the S3 object key
        Body: fileContent,
      };
      const data = await s3.upload(params).promise();
      console.log(data.Location);
      return data.Location; // Return the URL of the uploaded image
    });

    const imageUrls = await Promise.all(promises);
    res.json(imageUrls); // Respond with the URLs of the uploaded images
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
