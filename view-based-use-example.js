//VIEW BASED USAGE EXAMPLE
const knackAPI = new KnackAPI({
    auth: 'view-based',
    applicationId: Knack.application_id,
});

// const knackAPI = new KnackAPI({
//     auth: 'view-based',
//     applicationId: Knack.application_id,
//     staticUserToken: 'asdfasdafsdf'
// });

async function view17Handler_viewBased(parentRecord, parentRecordView){

    async function getConnectedChildren(record){
        return await knackAPI.getMany({
            view: 'view_13', 
            scene: 'scene_9',
            filters: {match: 'and', rules: [{field: 'field_20', operator: 'is', value: record.id}]},
            helperData: {a: 1, b: 2}
        });
    };

    async function updateConnectedChildren(connectedChildrenRecords, parentRecord){

        const records = [];
        connectedChildrenRecords.forEach((record, i) => {
            records.push({
                id: record.id,
                field_18: `${parentRecord.field_19} ${i}`
            });
        });

        return await knackAPI.putMany({
            records,
            view: 'view_14',
            scene: 'scene_11',
            helperData: {connectedChildrenRecords, foo: 'bar', something: 'else'},
            retries: 5,
            progressBar: {insertAfter: `#${parentRecordView.key}`, id: 'updateChildrenProgress'},
            progressCbs: [
                (progress, len, fetchResult) => console.log('custom progress', progress, len),
                (progress, len, fetchResult) => console.log('custom progress2', progress, len)
            ],
            resultsReport: {insertAfter: `#updateChildrenProgress`, id: 'updateChildrenSummary'}
        });
    }

    async function timestampParent(record){
        return await knackAPI.put({
            recordId: record.id,
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

    async function createThirdThingRecord(val){
        return await knackAPI.post({
            scene: 'scene_9',
            view: 'view_20',
            body: {field_27: val},
            helperData: {from: 'createRecord', something: 'else'}
        });
    }

    async function createTenThirdThings(val){
        const records = [];
        for(let i = 0; i < 10; i++){
            records.push({
                field_27: `${val} ${i}`
            });
        }

        return await knackAPI.postMany({
            records,
            scene: 'scene_9',
            view: 'view_20',
            helperData: {from: 'create100ThirdThings', baseVal: val},
            retries: 5,
            progressBar: {insertAfter: `#${parentRecordView.key}`, id: 'create100Progress'},
            progressCbs: [
                (progress, len, fetchResult) => console.log('custom progress', progress, len),
                (progress, len, fetchResult) => console.log('custom progress2', progress, len)
            ],
            resultsReport: {insertAfter: `#create100Progress`, id: 'create100Summary'}
        });

    }

    async function deleteThirdThing(id){
        return await knackAPI.delete({
            recordId: id, 
            scene: 'scene_9',
            view: 'view_21',
            helperData: {from: 'deleteThirdThing', id},
        })
    }

    async function getThirdThingRecords(val){
        return await knackAPI.getMany({
            scene: 'scene_9', 
            view: 'view_21',
            filters: {match: 'and', rules: [{field: 'field_27', operator: 'contains', value: val}]},
            helperData: {from: 'getThirdThingRecords'}
        });
    }

    async function deleteThirdThingRecords(records){
        return await knackAPI.deleteMany({
            records,
            scene: 'scene_9',
            view: 'view_21',
            helperData: {from: 'deleteThirdThingRecords'},
            retries: 5,
            progressBar: {insertAfter: `#${parentRecordView.key}`, id: 'deleteThirdThingsProgress'},
            progressCbs: [
                (progress, len, fetchResult) => console.log('custom progress', progress, len),
                (progress, len, fetchResult) => console.log('custom progress2', progress, len)
            ],
            resultsReport: {insertAfter: `#deleteThirdThingsProgress`, id: 'deleteThirdThingsSummary'}
        });
    }

    try {
        //GET MANY
        const connectedChildren = await getConnectedChildren(parentRecord);
        console.log(connectedChildren);

        //UPDATE MANY
        const updateChildrenResult = await updateConnectedChildren(connectedChildren.records, parentRecord);
        console.log(updateChildrenResult);

        //UPDATE SINGLE
        const timestampParentResult = await timestampParent(parentRecord);
        console.log(timestampParentResult);

        //GET SINGLE
        const parentRecordUpdated = await getParent(parentRecord.id);
        console.log(parentRecordUpdated);

        //CREATE SINGLE
        const singleThirdThing = await createThirdThingRecord(parentRecord.field_19);
        console.log(singleThirdThing);

        //CREATE MANY
        const tenThirdThings = await createTenThirdThings(parentRecord.field_19);
        console.log(tenThirdThings)

        
        //DELETE SINGLE
        const deleteResult = await deleteThirdThing(singleThirdThing.json.record.id);
        console.log(deleteResult);

        //GET MANY
        const thirdThingsToDelete = await getThirdThingRecords(parentRecord.field_19);
        console.log(thirdThingsToDelete);

        //DELETE MANY
        if(thirdThingsToDelete.records){
            const deleteThirdThingsResult = await deleteThirdThingRecords(thirdThingsToDelete.records);
            console.log(deleteThirdThingsResult);
        }

    } catch(err) {
        console.log(err);
        console.log(err.details);
    } 
}



$(document).on('knack-form-submit.view_17', async (event, view, record) => {
    view17Handler_viewBased(record, view);
});