const KnackAPI = require('../knack-api-helper.js');
const fs = require('fs');
const path = require('path');

//SINGLE FILE UPLOAD
async function uploadFileTest() {

    //Assuming there's a file stored in the same directory this is running called test.html
    //Extract the necessary information from the file and create a file stream
    const filePath = path.join(__dirname, 'test-uploadFileFromInput.html');
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    try {

        //Initialise knack-api-helper
        const knackAPI = new KnackAPI({
            auth: 'view-based',
            applicationId: "5c6c953b6a0ddb28d77b4f98",
        });

        //Upload the file to Knack servers
        const { uploadedFileId, response } = await knackAPI.uploadFile({
            fileStream,
            fileName
        });

        console.log('Upload successful. Here is the file ID to save to your Knack record: ', uploadedFileId);
        console.log(response)

    } catch (error) {
        console.error(error);
    }

}

uploadFileTest();

//MULTI FILE UPLOAD
async function uploadFilesTest() {

    //Assuming there's a file stored in the same directory this is running called test.html
    //Extract the necessary information from the file and create a file stream
    const filePaths = [
        path.join(__dirname, 'test-uploadFilesFromInput.html'),
        path.join(__dirname, 'test-uploadFilesFromInput.html'),
        path.join(__dirname, 'test-uploadFilesFromInput.html'),
    ]

    const filesToUpload = filePaths.map(filePath => {
        return {
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

    } catch(err) {
        // Handle any other errors
        // Errors from uploadFiles will not reach here
        console.error(err);
    }

}

// uploadFilesTest();
