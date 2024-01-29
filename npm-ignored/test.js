//import knack-api-helper.js 
const KnackAPI = require('../knack-api-helper.js');

async function run() {

    const knackAPI = new KnackAPI({
        auth: 'view-based',
        applicationId: "5f50bca256b365195f1be866",
        userToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjE3NzhhY2JiZTc1MmUwMDFmMDRkOGVlIiwiYXBwbGljYXRpb25faWQiOiI1ZjUwYmNhMjU2YjM2NTE5NWYxYmU4NjYiLCJpYXQiOjE3MDY0OTY1NTZ9.pno1-cxz_ecgO5spmOQBvbrkVGzNKw9zh8a5N1f0ktA'
    });

    // await knackAPI.login({
    //     email: 'XXX',
    //     password: 'XXX'
    // })

    const res = await knackAPI.getFromReportView({
        view: 'view_884',
        scene: 'scene_397',
        //sceneRecordId: '63e1bfe1a978400745e3a736'
    })

    console.log(res.json);
    console.log(res.json.reports[0]);
    console.log(res.json.reports[0].filters)


    console.log('done');

    //Do whatever you need to do

}

run();
