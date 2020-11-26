const boxFlowSchema = require("../../models/boxflow");

module.exports.saveBoxFlow = (boxFlow) => {
  return boxFlowSchema.create({
    phoneNumber: "whatsapp:+573022939843",
    ...boxFlow,
  });
};

module.exports.getByCategories = (since) => {
  const match =  { phoneNumber: "whatsapp:+573022939843" }
  if(since) match.createdAt = { $gte: since } 
  return boxFlowSchema.aggregate([
    { $match: match },
    {
        $group: {
            _id: {$toLower: '$category'},
            purchases: {$addToSet: {'amount': '$amount', date: '$createdDate'} }
        }
    },
    {
        $project: {
          purchases: "$purchases",
          category: "$_id",
          _id: false,
        },
      }
  ]);
};

module.exports.getByMonth = () => {
  return boxFlowSchema.aggregate([
    { $match: { phoneNumber: "whatsapp:+573022939843" } },
    {
      $group: {
        _id: { $substr: ["$createdDate", 0, 7] },
        total: { $sum: "$amount" },
      },
    },
    {
      $project: {
        total: "$total",
        month: "$_id",
        _id: false,
      },
    }
  ]);
};
module.exports.getAllSince = (since)=>{
  if(!since) throw 'Since is mandatory'
  return boxFlowSchema.find({
    createdAt: { $gte: since }
  }).sort({createdAt: -1})
}
module.exports.getByMonth = () => {
  return boxFlowSchema.aggregate([
    { $match: { phoneNumber: "whatsapp:+573022939843" } },
    {
      $group: {
        _id: { $substr: ["$createdDate", 0, 7] },
        total: { $sum: "$amount" },
      },
    },
    {
      $project: {
        total: "$total",
        month: "$_id",
        _id: false,
      },
    }
  ]);
};
