function delay(ms) {
    new Promise((resolve) => setTimeout(resolve, ms));
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
            return await myFetch(url, options, helperData);
        } catch (err){
            const isLastRetry = i === retries;
            if(isLastRetry) throw err;
            console.log(`failed myFetch ${options.method ? options.method : ""} to ${url}, attempt ${i}. retrying`);
        }
    }
}

async function myFetchDelayed (settings) {
  await delay(settings.delayMs ? settings.delayMs : 0);
  return await myFetchAutoRetry(settings.url, settings.options, settings.helperData, settings.retries)  
}

async function myFetchMany (records) {
    let promises = [];
    records.forEach( (record, i) => {
        const promise = myFetchDelayed({
            url: record.fetch.url, 
            options: record.fetch.options, 
            helperData: {originalRecord: record, delay: i*125, i}, 
            retries: record.fetch.retries, 
            delayMs: i*125
        })
        promises.push(promise);
    });

    return Promise.allSettled(promises)
    .then(results => {
        return results;
    })
    .catch(err => {
        throw err;
    }); 

}

const knackAPI = {
    buildFilters(filters) {
        return `filters=${JSON.stringify(filters)}`
    },
    viewBased: {
        async get(settings){
            const url = `https://api.knack.com/v1/pages/${scene}/views/${view}/records`;
            if(filters) url += `?${this.buildFilters(settings.filters)}`;
            const options = {
                method: 'GET',
                headers: {
                    "X-Knack-Application-ID": Knack.application_id,
                    "X-Knack-REST-API-Key": "knack",
                    "Authorization": Knack.getUserToken()
                }
            }
            return await myFetchAutoRetry(url, options, settings.helperData);
            

        }
    }
}

// function knackAPI(){
//     //Put some stuff here to help us build Knack API requests
//         //Get single record
//         //Get multi records
//         //Get multi records with multi pages
//         //Post 
//         //Put
//         //Delete
// }

$(document).on('knack-form-submit.view_17', async (event, view, record) => {
    try {
        const connectedChildren = await knackAPI.viewBased.get({
            view: 'view_13', 
            scene: 'scene_9',
            filters: {match: 'and', rules: [{field: 'field_20', operator: 'is', value: record.id}]},
            helperData: {a: 1, b: 2}
        });
        console.log(connectedChildren);
    } catch {
        console.log(err);
    }
    // try {
    //     const connectedChildren = await myFetchAutoRetry(getConnectedChildren.url, getConnectedChildren.options, {});
    //     console.log(connectedChildren);
    // } catch {
    //     console.log(err.details);
    // }
    
    // const filters = knackAPI.filters({
    //     match: 'and',
    //     rules: [
    //         {field: 'field_20', operator: 'is', value: record.id}
    //     ]
    // })

    // console.log(filters);

    // const getConnectedChildren = `https://api.knack.com/v1/pages/scene_9/views/view_13/records?${filters}`;

    // console.log(getConnectedChildren);

    // const options = {
    //     method: 'GET',
    //     headers: {
    //         "X-Knack-Application-ID": Knack.application_id,
    //         "X-Knack-REST-API-Key": "knack",
    //         "Authorization": Knack.getUserToken()
    //     }
    // }
    // try {
    //     const connectedRecords = await myFetchAutoRetry(getConnectedChildren, options, {});
    //     console.log(connectedRecords);
    // } catch(err){
    //     console.log(err);
    // }
    
    


});

//Running myFetchMany
// const records = [//Eg we got these from Knack API
//     {id: 1, field_1: 'asdf'},
//     {id: 2, field_1: 'asdf2'},
//     {id: 3, field_1: 'asdf3'},
//     {id: 4, field_1: 'asdf4'},
// ]

// records.forEach(record => {
//     record.fetch = {
//         url: `https://jsonplaceholder.typicode.com/todoss/${record.id}`,
//         options: {},
//         retries: 5
//     }
// });

//Calling via promise
// myFetchMany(records)
//     .then(results => console.log(results))
//     .catch(err => console.log(err))

//calling via async function
// const runCode = async () => {
//     try {
//         const results = await myFetchMany(records);
//         console.log(results);
//     } catch(err) {
//         console.log(err);
//     }
// }
// runCode();


//More complex options setup example
// records.forEach(record => {
//     record.fetch = {
//         url: `
//             https://jsonplaceholder.typicode.com/todoss/${record.id}?
//             filters={"match":"and","rules":[{"field":"field_20","operator":"is","value":["${record.id}"]}]}
//         `,
//         retries: 5,
//         options: {
//             method: 'GET',
//             headers: {},
//             body: {
//                 field_1: record.field_1
//             }
//         }
//     }
// });