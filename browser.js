(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.KnackAPI = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
//Import custom fetch library
const _fetch = require('@callum.boase/fetch');

//Use native browser FormData if in browser, or require('form-data') if in Nodejs
if(inBrowser()) {
    FormData = window.FormData;
} else {
    var FormData = require('form-data');
}

//Helper function to check if we are in the browser
function inBrowser(){
    try {
        window.fetch;
        return true
    } catch (err){
        return false;
    }
}


//The main knack-api-helper
function KnackAPI(config) {

    checkConfig();

    if(config.auth === 'view-based'){
        
        this.headers = {
            "X-Knack-Application-ID": config.applicationId,
            "X-Knack-REST-API-Key": "knack",
            "Authorization": typeof config.userToken === 'string' ? config.userToken : "",
            "Content-Type": "application/json"
        }

    } else if(config.auth === 'object-based'){

        this.headers = {
            "X-Knack-Application-ID": config.applicationId,
            "X-Knack-REST-API-Key": config.apiKey,
            "Content-Type": "application/json"
        }

    }

    this.urlBase = `https://api.knack.com/v1`;

    this.remoteLogin = async function(settings = {email, password}){
        return await _fetch.one({
            url: `${this.urlBase}/applications/${this.headers['X-Knack-Application-ID']}/session`,
            options: {
                method: 'POST',
                body: JSON.stringify({
                    email: settings.email,
                    password: settings.password
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        });
    }

    this.login = async function(settings = {email, password}){
        if(settings.email && settings.password){
            const res = await this.remoteLogin(settings);
            const token = res.json.session.user.token;
            this.headers.Authorization = token;
            return token;
        } else {
            throw new Error('You did not specify one/both of email and password in settings object. Could not log in');
        }

    },

    this.validateSession = async function (settings = {userToken, userRoleCheck}) {

        if(typeof settings.userToken !== 'string'){
            throw new Error('You must provide a settings object with at least a userToken (string) to validateSession()');
        }

        try {
      
            const response = await _fetch.one({
                url: `${this.urlBase}/session/token`,
                options: {
                    method: 'GET',
                    headers: {
                        'Authorization': settings.userToken,
                        'x-knack-application-id': this.headers['X-Knack-Application-ID']
                    }
                }
            });
      
            //Will automatically error if session not valid.
      
            //If we get to here, it's is a real user token. Now we perform more checks.
      
            const session = response.json?.session;

            if(!session) throw new Error('No session found');
            if (session.user.status !== 'current') throw new Error('Valid user but session not current.')
            if (session.user.account_status !== 'active') throw new Error('Valid user but status not active.');
            if (session.user.approval_status !== 'approved') throw new Error('Valid user but approval status is not approved.');
      
            if (settings.userRoleCheck) {
                if (!session.user.profile_keys.includes(settings.userRoleCheck)) {
                    throw new Error('Valid user but does not include the specified user role.')
                }
            }

            //All checks passed. The session is valid
            return true;
        
        } catch (err) {
            //The session is not valid
            return false;
        }
    }, 

    this.url = function(settings = {scene, view, object, recordId}){
        
        let url = this.urlBase;

        if(config.auth === 'view-based'){
            url += `/pages/${settings.scene}/views/${settings.view}/records/`;
        } else if (config.auth === 'object-based'){
            url += `/objects/${settings.object}/records/`;
        }

        if(settings.recordId) url += settings.recordId;
        return url;
    }

    this.getRetries = function(retries) {
        if(typeof retries === 'number'){
            return retries;
        } else {
            return 5;
        }
    }

    this.setup = function(method, settings){
        let url = "";

        if(config.auth === 'view-based'){

            url = this.url({
                scene: settings.scene, 
                view: settings.view, 
                recordId: settings.recordId
            });
        
        } else if (config.auth === 'object-based'){

            url = this.url({
                object: settings.object, 
                recordId: settings.recordId
            });

        }

        const options = {
            method,
            headers: this.headers,
        }

        if(settings.body) options.body = JSON.stringify(settings.body);

        const retries = this.getRetries(settings.retries);
        return {url, options, retries, helperData: settings.helperData};

    }

    this.single = async function(method, settings){
        const req = this.setup(method, settings);
        return await _fetch.one(req);
    }

    this.many = async function(method, settings){

        if(method === 'GET') return console.log('knackAPI.many is only for POST, PUT and DELETE');

        const requests = [];

        settings.records.forEach(record => {
            const reqSettings = {
                view: settings.view, 
                scene: settings.scene, 
                object: settings.object,
                retries: settings.retries
            }
            if(method !== 'DELETE'){
                reqSettings.body = record;
            }
            if(method !== 'POST'){
                reqSettings.recordId = record.id;
            }
            requests.push(this.setup(method, reqSettings));
        });

        if(settings.resultsReport) this.tools.manyResultsReport.remove(settings.resultsReport); 

        const progressCbs = this.progressCbsSetup(settings); 

        const results = await _fetch.many({requests, delayMs: 125, progressCbs});
        results.settings = settings;
        results.summary = this.tools.manyResultsReport.calc(results);

        if(settings.resultsReport){
            this.tools.manyResultsReport.create(settings.resultsReport, results);
        }

        return results;
    }

    this.progressCbsSetup = function(settings){

        let progressCbs = [];
        if(settings.progressBar){
            this.tools.progressBar.create(settings.progressBar);
            progressCbs.push((progress, len, fetchResult) => {
                this.tools.progressBar.update(settings.progressBar.id, progress, len);
            });
        }

        if(settings.progressCbs && settings.progressCbs.length){
            settings.progressCbs.forEach(progressCb => progressCbs.push(progressCb));
        }

        return progressCbs;

    }

    this.get = async function(settings = {view, scene, object, recordId, helperData}){
        return await this.single('GET', settings);
    }

    this.post = async function(settings = {view, scene, object, body, helperData, retries}){
        return await this.single('POST', settings);
    }

    this.put = async function(settings = {recordId, view, scene, object, body, helperData, retries}){
        return await this.single('PUT', settings);
    }

    this.delete = async function(settings = {recordId, view, scene, object, helperData, retries}){
        return await this.single('DELETE', settings);
    }


    this.getMany = async function(settings = {view, scene, object, filters, rowsPerpage, startAtPage, maxRecordsToGet, helperData}, currentPage = 1, final = {records: [], pages: []}){

        const req = this.setup('GET', settings);

        if(currentPage === 1){//Only on the first run, not subequent runs
            if(settings.startAtPage > 1) currentPage = settings.startAtPage;
        }

        const maxRecordsToGet = settings.maxRecordsToGet > 0 ? settings.maxRecordsToGet : Infinity;
        
        let rowsPerPage = settings.rowsPerPage ? settings.rowsPerPage : 1000;

        req.url += `?page=${currentPage}&rows_per_page=${rowsPerPage}`;

        if(settings.format) req.url += `&format=${settings.format}`;
        if(settings.filters) req.url += `&filters=${JSON.stringify(settings.filters)}`;

        const result = await _fetch.one(req);

        final.pages.push(result);
        result.json.records.map(record => final.records.push(record));
        final.helperData = settings.helperData;

        if(final.records.length > maxRecordsToGet){
            final.records = final.records.splice(0,maxRecordsToGet);
        }

        if(final.records.length < maxRecordsToGet && result.json.current_page < result.json.total_pages){
            return await this.getMany(settings, result.json.current_page + 1, final);
        } else {
            return final;
        }
    }

    this.putMany = async function(settings = {records, view, scene, object, helperData, retries, progressBar, progressCbs, resultsReport}){
        return await this.many('PUT', settings);
    }

    this.postMany = async function (settings = {records, view, scene, object, helperData, retries, progressBar, progressCbs, resultsReport}){
        return await this.many('POST', settings);
    }

    this.deleteMany = async function(settings = {records, view, scene, object, helperData, retries, progressBar, progressCbs, resultsReport}){
        return await this.many('DELETE', settings);
    }

    //API call to get data from a report view like pivot table, bar chart or similar. Only works with view-based auth
    this.getFromReportView = async function(settings = {view, scene, sceneRecordId, helperData, retries}){

        //Check for errors in config, since it's a bit different to other API calls
        if (config.auth !== 'view-based') throw new Error('getFromReportView() only works when using view-based auth');
        if (!settings.view || !settings.scene) throw new Error('getFromReportView() requires a view and scene. You did not specify one or both.');
        if (settings.recordId) throw new Error('getFromReportView() does not support recordId. Specify settings.sceneRecordId if you are trying to load a report on a child page that has the data source of "this page\'s record" or similar.');

        //Build the URL, which has a different format to other API calls
        //All reports API calls take format of /pages/{scene}/views/{view}/report
        //If the report is on a child page with data source of "this page's record", then we need to add query string of ?{sceneSlug}_id={sceneRecordId} so Knack knows what record to filter records by
        //Eg /pages/scene_1/views/view_1/report?dashboard_id=63e1bfe1a978400745e3a736
        let url = `${this.urlBase}/scenes/${settings.scene}/views/${settings.view}/report`;
        if(settings.sceneRecordId) {
            const sceneSlug = await this.getSceneSlug(settings.scene);
            url += `?${sceneSlug}_id=${settings.sceneRecordId}`
        }

        //Build the _fetch request object
        const req = {
            url,
            options: {
                method: 'GET',
                headers: this.headers
            },
            retries: this.getRetries(settings.retries),
            helperData: settings.helperData
        }

        //Run the API call.
        return await _fetch.one(req);

    }

    // Helper function to check that a Filestream (for file uploads) is readable
    // This is a way to check if the file exists & has a size among other things
    this.checkStreamReadable = async function(stream) {
        if (!stream) {
            throw new Error('No stream provided to check');
        }
    
        // For browser File/Blob objects, just check size exists
        if (inBrowser()) {
            if (stream.size === undefined) {
                throw new Error('Invalid or inaccessible stream: no size property found');
            }
            return true;
        }
    
        // For Node.js ReadStream or other readable streams
        if (stream.readable) {
            try {
                await new Promise((resolve, reject) => {
                    const cleanup = () => {
                        stream.removeListener('readable', onReadable);
                        stream.removeListener('error', onError);
                    };
                    
                    const onReadable = () => {
                        cleanup();
                        // Reset stream position
                        stream.unshift(stream.read(1));
                        resolve(true);
                    };
                    
                    const onError = (error) => {
                        cleanup();
                        reject(new Error(`Invalid or inaccessible stream: ${error.message}`));
                    };
    
                    stream.once('readable', onReadable);
                    stream.once('error', onError);
                });
                return true;
            } catch (err) {
                throw new Error(`Error accessing stream: ${err.message}`);
            }
        }
    
        throw new Error('Provided stream is not readable');
    };

    // Helper function to check filestreams and prepare for upload to Knack
    this.uploadFilePrep = async function(settings = {uploadType, fileStream, fileName, helperData, retries}) {

        // Check that uplaodType is either 'file' or 'image'
        if (!settings.uploadType || (settings.uploadType !== 'file' && settings.uploadType !== 'image')) {
            throw new Error('you must specify the uploadType ("file" or "image") when running uploadFile or uploadFiles');
        }

        // Validate the presence of fileStream
        if (!settings.fileStream) {
            throw new Error('uploadFile requires a fileStream to be provided');
        }
        
        // Make sure the filestream is an object with a readable or blob-like structure
        if (typeof settings.fileStream !== 'object' || (!settings.fileStream.readable && !settings.fileStream.size)) {
            throw new Error('uploadFile requires fileStream to be a readable stream or a Blob/File-like object');
        }

        // Verify stream is readable
        await this.checkStreamReadable(settings.fileStream);

        // Check if fileName is provided and is a string
        if (!settings.fileName) {
            throw new Error('uploadFile requires a fileName to be provided');
        }
        if (typeof settings.fileName !== 'string') {
            throw new Error('uploadFile requires fileName to be a string');
        }
    
        // Check for the presence of a file extension
        if (!settings.fileName.includes('.') || settings.fileName.split('.').pop() === settings.fileName) {
            throw new Error('uploadFile requires fileName to include a file extension');
        }
    
        // Prepare the form data for file upload
        let formData = new FormData();
        formData.append("files", settings.fileStream, settings.fileName);
    
        //Construct headers
        const headers = {
            'X-Knack-REST-API-Key': 'knack',
            'X-Knack-Application-ID': config.applicationId,
        }
    
        //Manually add formData info to the headers if in nodejs
        if(!inBrowser()) {
            Object.assign(headers, formData.getHeaders());
        }

        //Determine the url, based on whether we are uploading a file or image
        let url;
        if(settings.uploadType === 'image') {
            url = `${this.urlBase}/applications/${config.applicationId}/assets/image/upload`;
        } else {
            url = `${this.urlBase}/applications/${config.applicationId}/assets/file/upload`;
        }
        
        // Construct the request object for _fetch
        const req = {
            url,
            options: {
                method: 'POST',
                body: formData,
                headers: headers,
            },
            retries: this.getRetries(settings.retries),
            helperData: settings.helperData
        };
        return req;
    };


    this.uploadFile = async function(settings = {uploadType, fileStream, fileName, helperData, retries}) {
        const req = await this.uploadFilePrep(settings);
        const response = await _fetch.one(req);
        return {
            response,
            uploadedFileId: response.json?.id,
        }
    };

    this.uploadFiles = async function(settings = {filesToUpload: [{uploadType, fileStream, fileName}], helperData, retries, progressCbs}) {
        const filesToUpload = settings.filesToUpload;
        
        //Validate data
        if (!filesToUpload) {
            throw new Error('uploadFiles requires a value for filesToUpload (an array of objects {fileStream, fileName})');
        }
        if (!Array.isArray(filesToUpload)) {
            throw new Error('uploadFiles requires filesToUpload to be an array');
        }
        if (filesToUpload.length === 0) {
            throw new Error('uploadFiles requires filesToUpload to contain at least one item {fileStream, fileName}');
        }

        //Build the requests to upload files
        const requests = [];
        for (const file of filesToUpload) {
            const request = await this.uploadFilePrep({
                uploadType: file.uploadType,
                fileStream: file.fileStream,
                fileName: file.fileName,
                helperData: settings.helperData,
                retries: settings.retries
            });
            requests.push(request);
        }

        const progressCbs = this.progressCbsSetup(settings); 

        // Run the requests
        const results = await _fetch.many({requests, delayMs: 125, progressCbs});

        // Extract helpful information from the results
        // We break from the standard many results format here to improve usability
        // In a future release, other many methods will be updated to use this format
        const summary = this.tools.manyResultsReport.calc(results);
        const allSucceeded = summary.rejected === 0;
        const uploadedFileIds = results.map(result => result.value?.json?.id);

        return {
            results,
            summary,
            allSucceeded,
            uploadedFileIds
        }

    };

    // Helper to prep for uploadFileFromInput and uploadFilesFromInput
    this.uploadFileFromInputPrep = function (fileInput) {
        //This method is only valid in the browser
        if (inBrowser() === false) {
            throw new Error('uploadFileFromInput and uploadFilesFromInput methods are only valid if running knack-api-helper in the browser. Use uploadFile() instead.');
        }

        // Validate the presence of fileInput
        if (!fileInput) {
            throw new Error('uploadFileFromInput requires a fileInput to be provided');
        }
        // Check fileInput is an object with a files property
        if (!fileInput.files) {
            throw new Error('uploadFileFromInput requires fileInput to have a files property');
        }

        // Validate there's at least one file and it has a size
        if (fileInput.files.length === 0) {
            throw new Error('uploadFileFromInput: no files found in fileInput. Could not continue');
        }

        const files = fileInput.files;

        // Check if each file has a size
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Check for file size
            if (!file.size) {
                throw new Error(`uploadFileFromInput: file (index ${i}) has no size. Could not continue`);
            }
        }

        return files;
    };

    // Modify existing uploadFileFromInput to use the new prep function
    this.uploadFileFromInput = async function (settings = { uploadType, fileInput, helperData, retries }) {
        const files = this.uploadFileFromInputPrep(settings.fileInput);
        const file = files[0];

        // Create a FormData object and append the file
        const formData = new FormData();
        formData.append('fileStream', file, file.name);

        //Upload the file to Knack servers
        return await this.uploadFile({
            uploadType: settings.uploadType,
            fileStream: formData.get('fileStream'),
            fileName: file.name,
            helperData: settings.helperData,
            retries: settings.retries
        });
    };

    // Add new uploadFilesFromInput function
    this.uploadFilesFromInput = async function (settings = { uploadType, fileInput, helperData, retries, progressCbs }) {
        const files = this.uploadFileFromInputPrep(settings.fileInput);

        const filesToUpload = Array.from(files).map(file => ({
            fileStream: file,
            fileName: file.name,
            uploadType: settings.uploadType
        }));

        return await this.uploadFiles({
            filesToUpload,
            helperData: settings.helperData,
            retries: settings.retries,
            progressCbs: settings.progressCbs
        });
    };

    this.tools = {
        progressBar: {

            html(id){
                return $(`
                    <div id="${id}" style="margin-bottom: 10px;">
                        <span class="before-progress-bar" style="margin-right: 5px;"><em><strong>Processing records</em></strong></span>
                        <progress id="progressBar" value="0" max="100"></progress>
                        <span class="after-progress-bar" style="margin-left: 5px;" id="progressText">Initialising...</span>
                    </div>
                `);
            },

            update(id, progress, len){
                $(`#${id} #progressBar`).val(Math.round(progress / len * 100));
                $(`#${id} #progressText`).text(`${progress}/${len}`);
            },

            create(progressBar){
                $(`#${progressBar.id}`).remove();
                if(progressBar.insertAfter){
                    this.html(progressBar.id).insertAfter(progressBar.insertAfter);
                } else if(progressBar.insertBefore){
                    this.html(progressBar.id).insertBefore(progressBar.insertBefore);
                } else if(progressBar.appendTo){
                    this.html(progressBar.id).appendTo(progressBar.appendTo);
                } else if(progressBar.prependTo){
                    this.html(progressBar.id).prependTo(progressBar.prependTo);
                } else {
                    console.log('Invalid progress bar location');
                } 
            }
        },

        manyResultsReport: {

            calc(results){
                const fulfilled = results.reduce((acc, curr) => {
                    if(curr.status === 'fulfilled') acc++;
                    return acc;
                },0);
                const rejected = results.reduce((acc, curr) => {
                    if(curr.status === 'rejected') acc++;
                    return acc;
                },0);
                const errors = results.filter(result => {
                    if(result.status !== 'fulfilled'){
                        return true;
                    } else {
                        return false;
                    }
                })
                return {fulfilled, rejected, errors};
            },

            html(id, results){
                const summary = this.calc(results);
                return $(`
                    <div id=${id}>
                        <p><strong>Finished processing</strong></p>
                        <p>Summary:</p>
                        <p>
                            <ul>
                                <li>Failed: ${summary.rejected}</li>
                                <li>Succeeded: ${summary.fulfilled}</li>
                            </ul>
                        </p>
                    </div>
                `) 
            },

            create(resultsReport, results){
                if(resultsReport.insertAfter){
                    this.html(resultsReport.id, results).insertAfter(resultsReport.insertAfter);
                } else if(resultsReport.insertBefore){
                    this.html(resultsReport.id, results).insertBefore(resultsReport.insertBefore);
                } else if(resultsReport.appendTo){
                    this.html(resultsReport.id, results).appendTo(resultsReport.appendTo);
                } else if(resultsReport.prependTo){
                    this.html(resultsReport.id, results).prependTo(resultsReport.prependTo);
                } else {
                    console.log('Invalid summary location');
                } 
            },

            remove(resultsReport){
                $(`#${resultsReport.id}`).remove();
            }

        }
    }


    //Utility function to get the current slug of a scene (eg dashboard) based on it's key (eg scene_21) using the Knack API
    this.getSceneSlug = async function(sceneKey) {
        const appDataUrl = `${this.urlBase}/applications/${this.headers['X-Knack-Application-ID']}`;

        const appData = await _fetch.one({
            url: appDataUrl,
            options: {
                method: 'GET',
            }
        });

        const scenes = appData.json.application.scenes;

        const scene = scenes.find(scene => scene.key === sceneKey);

        if(!scene) throw new Error(`Scene with key ${sceneKey} not found, when trying to find corresponding slug (url). Could not continue.`);

        const slug = scene.slug;
        if(!slug) throw new Error(`Scene with key ${sceneKey} found, but no slug (url) found. Could not continue.`);

        return slug;

    }


    function checkConfig(){

        if(!config) throw new Error('KnackAPI config settings object not found');

        if(!config.auth) throw new Error('KnackAPI.auth configuration not found');

        if(config.auth !== 'object-based' && config.auth !== 'view-based') {
            throw new Error(`KnackAPI.auth invalid - should be "view-based" or "object-based" but got "${config.auth}"`);
        }

        if(!config.applicationId) throw new Error(`KnackAPI.applicationId not found`);

        if(config.auth === 'object-based' && !config.apiKey) throw new Error('Object-based auth selected but did not find an API key');

        try {
            if(config.auth === 'object-based' && Knack) {
                console.log(`
                    Warning! Object-based auth selected but it looks like you are running code in the Knack Javascript area. 
                    We strongly recommend you use view-based auth instead;
                `)
            }
        } catch(err) {
        }
    }
}

async function makeRequest(method, options = {}, isPublic = false) {

    if(!inBrowser() || !window.Knack || !window.Knack.application_id) {
        throw new Error('makeKnackApiRequest is a shortcut method that only works when used in the browser where the window.Knack object is available. See documentation for other ways to use knack-api-helper.');
    }

    const applicationId = window.Knack.application_id;
    const knackAPI = new KnackAPI({
        auth: 'view-based',
        applicationId,
        userToken: isPublic ? null : Knack.getUserToken()
    });

    const response = await knackAPI[method](options);

    if (response?.summary?.rejected > 0) {
        const reasons = response.summary.errors.map(err => err.reason);
        throw new Error(`${response.summary.rejected} ${method} requests failed: ${reasons.join('; ')}`);
    }

    switch (method) {
        case 'get':
            return response.json;
        case 'getMany':
            return response.records;
        case 'post':
            return response.json.record;
        case 'postMany':
            return response.settings.records;
        case 'put':
            return response.json.record;
        case 'putMany':
            return response.settings.records;
    }
}

KnackAPI.makeRequest = makeRequest;

module.exports = KnackAPI;
},{"@callum.boase/fetch":2,"form-data":3}],2:[function(require,module,exports){
//Only load node-fetch in nodeJs environment
//If we're running this file in browser, we'll use the browser's fetch API which is built-in
//If bundling this module for browser usage, skip bundling node-fetch
//Eg if bundling using browserify add flag "--external node-fetch" when running "browserify..."
//  The bundling will assume node-fetch is already avaialble in the environment, which it will NOT be
//  So the if statement ensures we don't try to use the non-existent node-fetch
if(inBrowser()){
    fetch = window.fetch;
} else {
    var fetch = require('node-fetch');
}

function inBrowser(){
    try {
        window.fetch;
        return true
    } catch (err){
        return false;
    }
}

const _fetch = {
    
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    tools: {
        exponentialBackoff(attempt){
            return Math.pow(2, attempt - 1) * 1000; //1000, 2000, 4000 etc
        }
    },

    defaults: {

        retryDelay(attempt, mostRecentErr){
            if(mostRecentErr.details.response.status === 429){
                return Math.pow(2, attempt - 1) * 1000; //Exponential backoff same as _fetch.tools.exponentialBackoff
            } else {
                return 1000;
            }
        },

        retryOn(attempt, err){
            if(err.details && err.details.response && (err.details.response.status >= 500 || err.details.response.status === 429)){
                return true;
            } else {
                return false;
            }
        }
    },

    async wrapper(url, options = {}, helperData = {}) {

        try {

            const response = await fetch(url, options);

            const text = await response.text();

            //You can only consume response body methods once
            //So we get text above and then convert text to JSON if applicable
            let json = null;
            if(isJson(text)){
                json = JSON.parse(text);
            } 

            if(response && response.ok){
                return {url, options, response, helperData, json, text}
            }

            let err = new Error(`Successful http request but response.ok === false. Code: ${response.status}, Text: ${text}`);
            err.details = {url, options, response, helperData, json, text};
            throw err;
       
        } catch(err) {//This runs with either the above manually thrown error, or with fetch-API generated errors
            !err.details ? err.details = {url, options, helperData} : err.datails;
            throw err;
        }

        function isJson(text){
            try {
                JSON.parse(text);
                return true;
            } catch(err){
                return false;
            }
        }

    },

    async one (settings = {url, options, helperData, retries, retryDelay, retryOn}) {

        if(typeof settings !== 'object' || !settings.url) throw new Error('Invalid argument when calling _fetch.one. You must call _fetch.one with an object (settings), containing at-minimum: settings = {url: string}');

        if (!settings.options) settings.options = {method: 'GET'};
        if (settings.options && !settings.options.method) settings.options.method = 'GET';

        if (!settings.retries && settings.retries !== 0) settings.retries = 5;

        if(typeof settings.retryDelay !== 'function' && typeof settings.retryDelay !== 'number'){
            settings.retryDelay = this.defaults.retryDelay;
        }   

        if (typeof settings.retryOn !== 'function'){
            settings.retryOn = this.defaults.retryOn;
        }
    
        //thanks to: https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
        let mostRecentErr;

        for(let i = 0; i <= settings.retries; i++){
            try {

                if(i > 0) {
                    let retryDelay;

                    if(typeof settings.retryDelay === 'function') {
                        retryDelay = settings.retryDelay(i, mostRecentErr)
                    } else {
                        retryDelay = settings.retryDelay;
                    }

                    await this.delay(retryDelay);
                }
                return await this.wrapper(settings.url, settings.options, settings.helperData);
            
            } catch (err){

                const isLastRetry = i === settings.retries;
                if(isLastRetry) throw err;

                const shouldRetry = await settings.retryOn(i, err);
                if(!shouldRetry) throw err;

                mostRecentErr = err;

                console.log(`failed fetch ${settings.options.method} to ${settings.url}. Code: ${err.details && err.details.response ? err.details.response.status : ""}. Attempt ${i}. Retrying...`);
            }
        }
    },

    async many (settings = {requests, delayMs, progressCbs}) {

        if(!settings.delayMs) settings.delayMs = 125;
    
        let promises = [];
        settings.requests.forEach( (request, i) => {
            const promise = (async () => {
                await this.delay(i*settings.delayMs);
                const fetchResult = await this.one({
                    url: request.url, 
                    options: request.options,
                    retries: request.retries, 
                    retryDelay: request.retryDelay,
                    retryOn: request.retryOn,
                    helperData: {request, delayMs: i*settings.delayMs, i},
                });
                progress++
    
                if(settings.progressCbs && settings.progressCbs.length){
                    settings.progressCbs.forEach(progressCb => {
                        progressCb(progress, len, fetchResult)
                    });
                }
    
                return fetchResult;
            })();
            promises.push(promise);
        });
    
        const len = promises.length;
        let progress = 0;
    
        return Promise.allSettled(promises);
    }

}

if(typeof require != 'undefined') module.exports = _fetch;
},{"node-fetch":3}],3:[function(require,module,exports){

},{}]},{},[1])(1)
});
