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

async function myFetchAutoRetry (url, options, helperData = {}, retries = 5) {
    //thanks to: https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
    for(let i = 1; i <= retries; i++){
        try {
            if(i > 1) await delay(1000);
            return await myFetch(url, options, helperData);
        } catch (err){
            const isLastRetry = i === retries;
            if(isLastRetry) throw err;
            console.log(`failed myFetch ${options.method ? options.method : ""} to ${url}, attempt ${i}. retrying`);
        }
    }
}

async function myFetchMany (records, delayMs = 125, progressCbs) {
    let promises = [];
    records.forEach( (record, i) => {
        const promise = (async () => {
            await delay(i*delayMs);
            const fetchResult = await myFetchAutoRetry(
                record.fetchSettings.url, 
                record.fetchSettings.options, 
                {originalRecord: record, delayMs: i*delayMs, i},
            );
            progress++
            if(progressCbs && progressCbs.length){
                progressCbs.forEach(progressCb => {
                    console.log('one cb')
                    progressCb(progress, len, fetchResult)
                });
            }
            //progressCb(progress, len, fetchResult);
            return fetchResult;
        })();
        promises.push(promise);
    });

    const len = promises.length;
    let progress = 0;

    return Promise.allSettled(promises);
}

const knackAPI = {
    headers: {
        "X-Knack-Application-ID": Knack.application_id,
        "X-Knack-REST-API-Key": "knack",
        "Authorization": Knack.getUserToken(),
        "Content-Type": "application/json"
    },
    async get(settings = {view, scene, recordId, helperData}){
        let url = `https://api.knack.com/v1/pages/${settings.scene}/views/${settings.view}/records/${settings.recordId}`;

        const options = {
            method: 'GET',
            headers: this.headers
        };

        return await myFetchAutoRetry(url, options, settings.helperData);
    },
    async getMany(settings = {view, scene, filters, helperData}, page = 1, final = {records: [], pages: []}){
        let url = `https://api.knack.com/v1/pages/${settings.scene}/views/${settings.view}/records`;
        url += `?page=${page}&rows_per_page=1000`;
        if(settings.filters) url += `&filters=${JSON.stringify(settings.filters)}`;
        
        const options = {
            method: 'GET',
            headers: this.headers
        }

        const result = await myFetchAutoRetry(url, options, settings.helperData);

        final.pages.push(result);
        result.json.records.map(record => final.records.push(record));
        final.helperData = settings.helperData;

        if(result.json.total_pages > result.json.current_page){
            return await this.getMany(settings, result.json.current_page + 1, final);
        } else {
            return final;
        }
    },
    putSetup(settings = {record, view, scene, body, retries}){
        const url = `https://api.knack.com/v1/pages/${settings.scene}/views/${settings.view}/records/${settings.record.id}`;
        const options = {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify(settings.body)
        }
        const retries = settings.retries ? settings.retries : 5;
        return {url, options, retries};
    },
    async put(settings = {record, view, scene, body, helperData, retries}){
        const putSetup = this.putSetup(settings);
        return await myFetchAutoRetry(putSetup.url, putSetup.options, settings.helperData, putSetup.retries);
    },
    async putMany(settings = {records, view, scene, body, retries, progressBar, progressCb}){
        settings.records.forEach(record => {
            record.fetchSettings = this.putSetup({
                record, 
                view: settings.view, 
                scene: settings.scene, 
                body: settings.body, 
                retries: settings.retries
            });
        });
        let progressCbs = [];
        if(settings.progressBar){
            this.tools.progressBar.create(settings.progressBar);
            progressCbs.push((progress, len, fetchResult) => {
                this.tools.progressBar.update(settings.progressBar.id, progress, len);
                console.log(progress, len);
                console.log(fetchResult);
            });
        }
        if(settings.progressCb){
            progressCbs.push(settings.progressCb);
        }
        // if(!settings.progressCb && settings.progressBar){
        //     settings.progressCb = (progress, len, fetchResult) => {
        //         this.tools.progressBar.update(settings.progressBar.id, progress, len);
        //         console.log(progress, len);
        //         console.log(fetchResult);
        //     } 
        // }
        return await myFetchMany(settings.records, 125, settings.progressCbs);
    },
    tools: {
        progressBar: {
            html(id){
                return $(`
                    <div id="${id}">
                        <progress id="progressBar" value="0" max="100"></progress>
                        <span style="margin-left: 5px;" id="progressText"></span>
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
                    this.html(progressBar.id).insertBefore(progressBar.insertBefre);
                } else if(progressBar.appendTo){
                    this.html(progressBar.id).appendTo(progressBar.appendTo);
                } else if(progressBar.prependTo){
                    this.html(progressBar.id).prependTo(progressBar.prependTo);
                } else {
                    console.log('Invalid progress bar location');
                } 
            }
        },
        manyResults: {
            summary(results){
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
            htmlSummary(results){
                const summary = this.summary(results);
                console.log(summary);
                return $(`
                    <p><strong>Finished processing</strong></p>
                    <p>Summary:</p>
                    <p>
                        <ul>
                            <li>Failed: ${summary.rejected}</li>
                            <li>Succeeded: ${summary.fulfilled}</li>
                        </ul>
                    </p>
                `)
                
            }
        }
    }
}

// function knackAPI(){
//     //Put some stuff here to help us build Knack API requests
//         //Get single record DONE
//         //Get multi records DONE
//         //Get multi records with multi pages DONE    
//         //Post setup TO DO
//         //Post TO DO
//         //Put setup DONE
//         //Put DONE
//         //Delete setup TO DO
//         //Delete TO DO
// }

async function view17Handler(parentRecord, parentRecordView){

    async function getConnectedChildren(record){
        return await knackAPI.getMany({
            view: 'view_13', 
            scene: 'scene_9',
            filters: {match: 'and', rules: [{field: 'field_20', operator: 'is', value: record.id}]},
            helperData: {a: 1, b: 2}
        });
    };

    async function updateConnectedChildren(connectedChildrenRecords, parentRecord){
        return await knackAPI.putMany({
            records: connectedChildrenRecords,
            view: 'view_14',
            scene: 'scene_11',
            body: {field_18: parentRecord.field_19},
            retries: 5,
            progressBar: {insertAfter: `#${parentRecordView.key}`, id: 'updateChildrenProgress'},
            progressCb(progress, len, fetchResult){
                console.log('custom progress', progress, len)
            },
        });
    }

    async function timestampParent(record){
        return await knackAPI.put({
            record,
            view: 'view_19',
            scene: 'scene_15',
            body: {field_21: new Date()},
            retries: 5,
            helperData: {a: 1, b: 2}
        });
    }

    async function getParent(recordId){
        return await knackAPI.get({
            view: 'view_18',
            scene: 'scene_9',
            recordId: recordId,
            helperData: {a: 1, b: 2}
        });
    }

    try {
        const connectedChildren = await getConnectedChildren(parentRecord);
        console.log(connectedChildren);

        const progressId = 'updateChildrenProgress';
        $(`#${progressId}`).remove();
        // knackAPI.tools.progressBar.html(progressId).insertAfter(`#${parentRecordView.key}`);
        const updateChildrenResult = await updateConnectedChildren(connectedChildren.records, parentRecord);
        console.log(updateChildrenResult);
        knackAPI.tools.manyResults.htmlSummary(updateChildrenResult).insertAfter(`#${progressId}`);

        const timestampParentResult = await timestampParent(parentRecord);
        console.log(timestampParentResult);

        const parentRecordUpdated = await getParent(parentRecord.id);
        console.log(parentRecordUpdated);

    } catch(err) {
        console.log(err);
        console.log(err.details);
    } 
}

$(document).on('knack-form-submit.view_17', async (event, view, record) => {
    view17Handler(record, view);
});