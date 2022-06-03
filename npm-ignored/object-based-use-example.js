//OBJECT BASED USAGE EXAMPLE
const knackAPI_objectBased = new KnackAPI({
    auth: 'object-based',
    applicationId: '6178696a94053c001efaad0b',
    apiKey: 'd72b5c15-0aca-4b49-b49c-9ced3d230b54'
});

async function runKnackApiCode(parentRecord, parentRecordView){

    async function getConnectedChildren(record){
        return await knackAPI_objectBased.getMany({
            object: 'object_6',
            filters: {match: 'and', rules: [{field: 'field_20', operator: 'is', value: '624f9d8115eae700219143ef'}]},
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

        return await knackAPI_objectBased.putMany({
            records,
            object: 'object_6',
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
        return await knackAPI_objectBased.put({
            recordId: record.id,
            object: 'object_7',
            body: {field_21: new Date()},
            retries: 5,
            helperData: {a: 1, b: 2}
        });
    }

    async function getParent(recordId){
        return await knackAPI_objectBased.get({
            object: 'object_7',
            recordId: recordId,
            helperData: {a: 1, b: 2}
        });
    }

    async function createThirdThingRecord(val){
        return await knackAPI_objectBased.post({
            object: 'object_9',
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

        return await knackAPI_objectBased.postMany({
            records,
            object: 'object_9',
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
        return await knackAPI_objectBased.delete({
            recordId: id, 
            object: 'object_9',
            helperData: {from: 'deleteThirdThing', id},
        })
    }

    async function getThirdThingRecords(val){
        return await knackAPI_objectBased.getMany({
            object: 'object_9',
            filters: {match: 'and', rules: [{field: 'field_27', operator: 'contains', value: val}]},
            helperData: {from: 'getThirdThingRecords'}
        });
    }

    async function deleteThirdThingRecords(records){
        return await knackAPI_objectBased.deleteMany({
            records,
            object: 'object_9',
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
        const deleteResult = await deleteThirdThing(singleThirdThing.json.id);
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

runKnackApiCode();