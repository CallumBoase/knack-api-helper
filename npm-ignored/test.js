//import knack-api-helper.js 
const KnackAPI = require('../knack-api-helper.js');

async function run() {

    const knackAPI = new KnackAPI({
        // auth: "view-based",//Could also be object-based
        auth: 'view-based',
        applicationId: "5f50bca256b365195f1be866",
    });

    await knackAPI.login({
        email: 'callum@optimi.co.nz',
        password: 'XXX'
    })

    const res = await knackAPI.getFromReportView({
        view: 'view_791',
        scene: 'scene_278',
        sceneRecordId: '63e1bfe1a978400745e3a736' 
    })

    console.log(res.json.reports[0]);


    console.log('done');

    //Do whatever you need to do

}

run();
