//import knack-api-helper.js 
const KnackAPI = require('../knack-api-helper.js');

async function run() {

    const knackAPI = new KnackAPI({
        auth: "view-based",//Could also be object-based
        applicationId: "YOUR-APPLICATION-ID",
        //Could also initialise with a user token if you wanted to
    });

    const isAuthorized = await knackAPI.validateSession({
        userRoleCheck: 'profile_17',//The role you want to check for membership of (optional)
        userToken: 'YOUR_USER_TOKEN'
    });

    console.log(isAuthorized);//expected value: true or false

    if(!isAuthorized){
        return;
    }

    //Do whatever you need to do

}

run();
