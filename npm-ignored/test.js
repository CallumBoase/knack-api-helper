const KnackAPI = require('../knack-api-helper.js');
const fs = require('fs');
const path = require('path');

//SINGLE FILE UPLOAD
async function uploadFileTest() {

    //Assuming there's a file stored in the same directory this is running called test.html
    //Extract the necessary information from the file and create a file stream
    // const filePath = path.join(__dirname, 'test-uploadFileFromInput.html');
    const filePath = path.join(__dirname, 'example.png');
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    try {

        //Initialise knack-api-helper
        const knackAPI = new KnackAPI({
            auth: 'view-based', // You could also use object-based auth
            applicationId: "672bdafceb51560285a611a2",
            //No need for userToken or login when uploading files.
        });

        //Upload the file to Knack servers
        const { uploadedFileId, response } = await knackAPI.uploadFile({
            uploadType: 'file',//Or 'image'
            fileStream,
            fileName
        });

        console.log('Upload successful. Here is the file ID to save to your Knack record: ', uploadedFileId);

        // Create a new record in Knack with the file attached
        // This example uses a publicly accessible form, but you could also use a login protected one if you pass a userToken or run login first
        // You could also use object-based auth if knackAPI was initialised with auth: 'object-based'
        const newRecordResponse = await knackAPI.post({
            scene: 'scene_7',
            view: 'view_6',
            body: {
                field_23: uploadedFileId, //Assuming field_23 is a file or image field in your Knack database
                field_25: 'Hello', //Any other value(s) you wan to fill
            }
        })

        console.log('Added new record', newRecordResponse);

    } catch (error) {
        console.error(error);
    }

}

// uploadFileTest();

//MULTI FILE UPLOAD
async function uploadFilesTest() {

    //Assuming there's a file stored in the same directory this is running called test.html
    //Extract the necessary information from the file and create a file stream
    const filePaths = [
        path.join(__dirname, 'example.png'),
        path.join(__dirname, 'example2.png'),
        path.join(__dirname, 'example3.png'),
    ]

    const filesToUpload = filePaths.map(filePath => {
        return {
            uploadType: 'file',//Or 'image'
            fileStream: fs.createReadStream(filePath),
            fileName: path.basename(filePath)
        }
    });

    try {

        // Initialise knack-api-helper
        const knackAPI = new KnackAPI({
            auth: 'view-based',
            applicationId: "672bdafceb51560285a611a2",
        });

        //Upload the file to Knack servers
        const { results, uploadedFileIds, allSucceeded, summary } = await knackAPI.uploadFiles({
            filesToUpload
        });

        if (!allSucceeded) {
            console.error('At least one file failed to upload. Here is a summary of the results:', summary);
            console.log(results);
        } else {
            console.log('All files uploaded successfully. Here are the IDs of uploaded files to append to Knack records');
            console.log(uploadedFileIds);
        }

        // Create one record in Knack per uploaded file
        // With the uploaded file attached to the record
        // This example uses a publicly accessible scene and view, but you can also use a login-protected one if you run the login method first
        // You could also use object-based auth if knackAPI was initialised with auth: 'object-based'
        const records = uploadedFileIds.map(uploadedFileId => {
            return {
                field_23: uploadedFileId, //Assuming field_23 is a file or image field in your Knack database
                field_25: 'Hello', //Any other value(s) you wan to fill
            }
        });

        const newRecordResponses = await knackAPI.postMany({
            scene: 'scene_7',
            view: 'view_6',
            records
        })

        // Check if all records were added successfully
        if (newRecordResponses.summary.rejected > 0) {
            console.error('Some records failed to post. Here is a summary of the results:', newRecordResponses.summary);
        } else {
            console.log('All records added successfully', newRecordResponses);
        }

    } catch (err) {
        // Handle any other errors
        // Errors from uploadFiles will not reach here
        console.error(err);
    }

}

uploadFilesTest();
