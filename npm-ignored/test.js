const KnackAPI = require('../knack-api-helper.js');
const fs = require('fs');
const path = require('path');

//SINGLE
// async function run() {

//     //Assuming there's a file stored in the same directory this is running called test.html
//     //Extract the necessary information from the file and create a file stream
//     const filePath = path.join(__dirname, 'test.html');
//     const fileStream = fs.createReadStream(filePath);
//     const fileName = path.basename(filePath);

//     //Initialise knack-api-helper
//     const knackAPI = new KnackAPI({
//         auth: 'view-based',
//         applicationId: "5c6c953b6a0ddb28d77b4f98",
//     });

//     //Upload the file to Knack servers
//     const response = await knackAPI.uploadFile({
//         fileStream,
//         fileName
//     });

//     console.log(response);

//     //You can use response.json.id as the value for a file upload field in a Knack record.

// }

//MULTI
async function run() {

    //Assuming there's a file stored in the same directory this is running called test.html
    //Extract the necessary information from the file and create a file stream
    const filePaths = [
        path.join(__dirname, 'test.html'),
        path.join(__dirname, 'test.html'),
        path.join(__dirname, 'test.html'),
    ]

    const filesToUpload = filePaths.map(filePath => {
        return {
            fileStream: fs.createReadStream(filePath),
            fileName: path.basename(filePath)
        }
    });

    //Initialise knack-api-helper
    const knackAPI = new KnackAPI({
        auth: 'view-based',
        applicationId: "5c6c953b6a0ddb28d77b4f98",
    });

    //Upload the file to Knack servers
    const responses = await knackAPI.uploadFiles({
        filesToUpload
    });

    if(responses.summary.rejected > 0) {
        throw new Error('At least one response failed')
    } else {
        console.log('All files uploaded successfully');
        //You can now extract the IDs of the uploaded files and use them to create new Knack records
        const fileIdsForKnack = responses.map(response => response.value.json.id);
    }

}

run();
