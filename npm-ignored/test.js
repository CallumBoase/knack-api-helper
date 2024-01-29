//import knack-api-helper.js 
const KnackAPI = require('../knack-api-helper.js');

async function run() {

    const knackAPI = new KnackAPI({
        auth: 'view-based',
        applicationId: "XXX",
        userToken: 'XXX'
    });

    // await knackAPI.login({
    //     email: 'XXX',
    //     password: 'XXX'
    // })

    const res = await knackAPI.getFromReportView({
        view: 'view_3',
        scene: 'scene_2',
        //sceneRecordId: '63e1bfe1a978400745e3a736'
    })

    console.log(res.json);
    console.log(res.json.reports[0]);
    console.log(res.json.reports[0].filters)


    console.log('done');

    //Do whatever you need to do

}

run();
