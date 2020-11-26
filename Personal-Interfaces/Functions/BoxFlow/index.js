const { connect: connectToMongo, destroy: detroyMongoConnection, connectToMongoed } = require("../../../shared/database/mongo");
const boxFlowRepo = require("../../../shared/database/repos/boxFlow");
const prePaymentRepo = require("../../../shared/database/repos/prePayment");
const _ = require('lodash')
const moment = require('moment');
const toMonth = (date)=> `${date.toISOString()}`.substring(0,7)

const processMonthlyMetrics =async  ()=>{
  let results = await boxFlowRepo.getByMonth();
  if(!results || !results.length) results = [] 
    results = results.sort((a,b)=>{
        if(a.month > b.month) return 1
        if(a.month < b.month) return -1
        return 0
      })
      return results
}

const processCategoryMetrics = async  ()=>{
    let results = await boxFlowRepo.getByCategories();
    if(!results || !results.length) results = [] 
    results = results.map(item=>{
        const {
          category,
            purchases
          } = item
        const group = _.groupBy(purchases, i=>{
          const date = `${i.date.toISOString()}`
          return date.substring(0, 7)
        })
        const parsed = Object.keys(group).map(month=>{
            return {
              month,
                total: group[month].reduce((prev,curr)=>prev+curr.amount,0)
              }
            })
        return {
          category, 
            monthly: parsed.sort((a,b)=>{
              if(a.month > b.month) return 1
                if(a.month < b.month) return -1
                return 0
            })
        }
    })
    return results
}

const processHomeMetrics = async (since = null) =>{
  const startOfMonth = since || moment().startOf('month').subtract(1, 'month').toISOString();
  console.log(startOfMonth)
  const [totalByCategory, lastPurchases, prePayments] = await Promise.all([
    boxFlowRepo.getByCategories(startOfMonth),
    boxFlowRepo.getAllSince(startOfMonth),
    prePaymentRepo.getActive(startOfMonth),
  ])

  return {
    totalByCategory, lastPurchases, prePayments
  }
}

module.exports.get = async (event, context, callback) => {
  let results = [];
  const { multiValueQueryStringParameters: queryParams } = event;
  const metricType = queryParams && queryParams.metricType 
  ? queryParams.metricType[0] 
  : 'month';
  console.log(metricType)
  try {
    console.log(results)
    await connectToMongo()
    switch (metricType) {
      case 'month':
            results = await processMonthlyMetrics()
            break;
        case 'category':
            results = await processCategoryMetrics()
            break;
        case 'home': 
            results = await processHomeMetrics()
        default:
          break;
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: "500",
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(error),
    };
  }
  return {
    statusCode: "200",
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(results),
  };
};