const prePaymentsSchema = require("../../models/prePaymentsSchema");
const { connect, destroy, isConnected } = require("../mongo");

module.exports.create = async (prePayment = []) => {
  try {
    await connect();
    for (const payment of prePayment) {
      await prePaymentsSchema.create(payment);
    }
    await destroy();
  } catch (error) {
    console.log(error);
  }
};

module.exports.getActive = async (since) => {
  const match = {
    isAccepted: {$in: [false, null]},
    isHidden: { $in: [undefined, false] },
  }
  if(since) match.createdAt = { $gte: since } 

  try {
    await connect();
    const result = await prePaymentsSchema.find(match);
    await destroy();
    return result.reverse();
  } catch (e) {
    console.error(e);
    return {};
  }
};
module.exports.updatePrepayment = async (prepayment) => {
    if (!prepayment.id) throw new Error("PrepaymentsRepo::missing id for prepayment");
    return prePaymentsSchema.updateOne(
      { _id: prepayment.id },
      {
        isAccepted: prepayment.isAccepted,
        isHidden: prepayment.isHidden,
      }
    );
};
