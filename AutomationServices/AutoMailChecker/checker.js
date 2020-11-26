require('dotenv').config()
const imaps = require('imap-simple')
const utils = require('./utils')
const config = require('./configs')
const moment = require('moment')
const { create: createNewPrePay } = require('../../shared/database/repos/prePayment')
const configs = require('./configs')
const {
    SUBJECT_SEARCHED,
    MINUTES_AGO_SEARCH = '21600'
} = process.env

const start = async (event, context) =>{
    console.info('Connecting to email')
    const connection = await imaps.connect(config)
    console.info('Openning Inbox')
    await connection.openBox('INBOX')
    const date = moment()
    .subtract(MINUTES_AGO_SEARCH, 'minutes')
    .format()
    console.log('=== STARTING SOMETHING ===', {
        startDate: date, 
        now: moment().format()
    })
    const GranularData = []
    const searchValues =  [
        'UNSEEN',
        ['SINCE', date] ,
        ['SUBJECT', SUBJECT_SEARCHED],
    ]
    const results = await connection.search(searchValues, {
        bodies: ['HEADER', 'TEXT'],
        markSeen: true
    })
    if(results.length){
        const messages = await utils.readRawEmail(results)
        for (const message of messages) {
            const res = utils.searchBancolombia(message.html)
            if(!res) break;
            let  thenum = res.replace(/\D/g, "")
            thenum = thenum.slice(0, thenum.length - 2)
            GranularData.push({
                amount: +thenum,
                text: res,
                createdBy: 'AUTO_EMAIL_SERVICE',
                createdAt: new Date()
            })
        }
    }
    await createNewPrePay(GranularData)
    console.log('==== FINISHED with ' + GranularData.length + ' Messages');

    return context.done(null);
}
module.exports = {
    start
}
