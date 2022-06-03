const fetch = require("node-fetch");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

async function myFetch(url, options = {}, helperData = {}) {
    try {
        const response = await fetch(url, options);
        if(response && response.ok){
            return {url, options, response, helperData, json: await response.json()}
        }
        let err = new Error(`Successful http request but got status of ${response.status}`)
        err.details = {url, options, response, helperData};
        throw err;
    } catch(err) {//This runs with either the above manually thrown error, or with fetch-API generated errors
        !err.details ? err.details = {url, options, helperData} : err.datails;
        throw err;
    }
}

async function myFetchAutoRetry (settings = {url, options, helperData, retries}) {
    
    if (!settings.retries) settings.retries = 5;

    //thanks to: https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
    for(let i = 1; i <= settings.retries; i++){
        try {
            if(i > 1) await delay(1000);
            return await myFetch(settings.url, settings.options, settings.helperData);
        } catch (err){
            const isLastRetry = i === settings.retries;
            if(isLastRetry) throw err;
            console.log(`failed myFetch ${settings.options.method ? settings.options.method : ""} to ${settings.url}, attempt ${i}. retrying`);
        }
    }
}

async function myFetchMany (settings = {requests, delayMs, progressCbs}) {

    if(settings.delayMs) settings.delayMs = 125;

    let promises = [];
    settings.requests.forEach( (request, i) => {
        const promise = (async () => {
            await delay(i*settings.delayMs);
            const fetchResult = await myFetchAutoRetry({
                url: request.url, 
                options: request.options, 
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



function KnackAPI(config) {

    checkConfig();

    if(config.auth === 'view-based'){

        this.headers = {
            "X-Knack-Application-ID": config.applicationId,
            "X-Knack-REST-API-Key": "knack",
            "Authorization": config.staticUserToken ? config.staticUserToken : Knack.getUserToken(),
            "Content-Type": "application/json"
        }

    } else if(config.auth === 'object-based'){

        this.headers = {
            "X-Knack-Application-ID": config.applicationId,
            "X-Knack-REST-API-Key": config.apiKey,
            "Content-Type": "application/json"
        }

    }

    this.url = function(settings = {scene, view, object, recordId}){
        let url = "";
        if(config.auth === 'view-based'){
            url = `https://api.knack.com/v1/pages/${settings.scene}/views/${settings.view}/records/`;
        } else if (config.auth === 'object-based'){
            url = `https://api.knack.com/v1/objects/${settings.object}/records/`;
        }
        
        if(settings.recordId) url += settings.recordId;
        return url;
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

        const retries = settings.retries ? settings.retries: 5;
        return {url, options, retries, helperData: settings.helperData};

    }

    this.single = async function(method, settings){
        const req = this.setup(method, settings);
        return await myFetchAutoRetry(req);
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

        const results = await myFetchMany({requests, delayMs: 125, progressCbs});
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


    this.getMany = async function(settings = {view, scene, object, filters, helperData}, page = 1, final = {records: [], pages: []}){

        const req = this.setup('GET', settings);

        req.url += `?page=${page}&rows_per_page=1000`;
        if(settings.filters) req.url += `&filters=${JSON.stringify(settings.filters)}`;

        const result = await myFetchAutoRetry(req);

        final.pages.push(result);
        result.json.records.map(record => final.records.push(record));
        final.helperData = settings.helperData;

        if(result.json.total_pages > result.json.current_page){
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
                console.log(fulfilled)
                console.log(rejected)
                return {fulfilled, rejected};
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
                    this.html(resultsReport.id, results).insertAfter(resultsReport.insertBefore);
                } else if(resultsReport.appendTo){
                    this.html(resultsReport.id, results).insertAfter(resultsReport.appendTo);
                } else if(resultsReport.prependTo){
                    this.html(resultsReport.id, results).insertAfter(resultsReport.prependTo);
                } else {
                    console.log('Invalid summary location');
                } 
            },

            remove(resultsReport){
                $(`#${resultsReport.id}`).remove();
            }

        }
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
            if(config.auth === 'view-based' && !config.staticUserToken){
                if(!Knack) throw new Error('Selectd view-based auth without a specified user token, but cannot find Knack object');
            }

            if(config.auth === 'object-based' && Knack) {
                console.log(`
                    Warning! Object-based auth selected but it looks like you are running code in the Knack Javascript area. 
                    We strongly recommend you use view-based auth instead;
                `)
            }
        } catch {
            console.log('could not check conditions involving the Knack object - we must be in a different environment');
        }
    }
}

if(typeof module.exports != "undefined"){
    //https://medium.com/@gaute.meek/how-to-publish-a-js-library-to-npm-and-cdn-9d0bf9b48e11
    module.exports = KnackAPI;
}

