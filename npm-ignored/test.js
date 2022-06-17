const KnackAPI = require('../knack-api-helper.js');

const knackAPI = new KnackAPI({
    auth: 'object-based',
    applicationId: '6178696a94053c001efaad0b',
    apiKey: 'd72b5c15-0aca-4b49-b49c-9ced3d230b54'
});

async function getConnectedChildren(record){
    return await knackAPI.getMany({
        object: 'object_6',
        helperData: {a: 1, b: 2}
    });
};

async function run(){
    const children = await getConnectedChildren();
    console.log(children);
}
run();