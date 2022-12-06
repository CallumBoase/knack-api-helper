const _fetch = require('@callum.boase/fetch');

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

    this.remoteLogin = async function(settings = {email, password}){
        return await _fetch.one({
            url: `https://api.knack.com/v1/applications/${this.headers['X-Knack-Application-ID']}/session`,
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

        const retries = typeof settings.retries === 'number' ? settings.retries : 5;
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

module.exports = KnackAPI;