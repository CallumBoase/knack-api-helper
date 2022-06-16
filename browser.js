(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const _fetch = require('@callum.boase/fetch');

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


    this.getMany = async function(settings = {view, scene, object, filters, helperData}, page = 1, final = {records: [], pages: []}){

        const req = this.setup('GET', settings);

        req.url += `?page=${page}&rows_per_page=1000`;
        if(settings.filters) req.url += `&filters=${JSON.stringify(settings.filters)}`;

        const result = await _fetch.one(req);

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
        } catch(err) {
            console.log('could not check conditions involving the Knack object - we must be in a different environment');
        }
    }
}

module.exports = KnackAPI;
},{"@callum.boase/fetch":2}],2:[function(require,module,exports){
//Only load node-fetch in nodeJs environment
//If we're running this file in browser, we'll use the browser's fetch API which is built-in
//If bundling this module for browser usage, skip bundling node-fetch
//Eg if bundling using browserify add flag "--external node-fetch" when running "browserify..."
//  The bundling will assume node-fetch is already avaialble in the environment, which it will NOT be
//  So the if statement ensures we don't try to use the non-existent node-fetch
if(typeof fetch == 'undefined' && typeof require != 'undefined'){
    var fetch = require('node-fetch');
}

const _fetch = {
    
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async wrapper(url, options = {}, helperData = {}) {
        try {

            const response = await fetch(url, options);
            
            const isJson = response.headers.get('content-type')?.includes('application/json');
            
            let json = null;
            let text = null;
            if(isJson){//We can only do either response.json() or response.text();
                json = await response.json();
            } else {
                text = await response.text();
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
    },

    async one (settings = {url, options, helperData, retries}) {
    
        if (!settings.retries) settings.retries = 5;
        if (!settings.options) settings.options = {method: 'GET'};
        if (!settings.options.method) settings.options.method = 'GET';
    
        //thanks to: https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
        for(let i = 1; i <= settings.retries; i++){
            try {
                if(i > 1) await this.delay(1000);
                return await this.wrapper(settings.url, settings.options, settings.helperData);
            } catch (err){
                const isLastRetry = i === settings.retries;
                if(isLastRetry) throw err;
                console.log(`failed fetch ${settings.options.method} to ${settings.url}. Code: ${err.details && err.details.response ? err.details.response.status : ""}. Attempt ${i}. Retrying...`);
            }
        }
    },

    async many (settings = {requests, delayMs, progressCbs}) {

        if(settings.delayMs) settings.delayMs = 125;
    
        let promises = [];
        settings.requests.forEach( (request, i) => {
            const promise = (async () => {
                await this.delay(i*settings.delayMs);
                const fetchResult = await this.one({
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

}

module.exports = _fetch;
},{"node-fetch":"node-fetch"}]},{},[1]);