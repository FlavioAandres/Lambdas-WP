const dataCreditoSchema = require('../../models/datacredito.model');
const { getUser } = require("../repos/user.repo");
const { connect, destroy, isConnected } = require("../mongo");


module.exports.create = async (dataCreditoBody) => {
    try {
        await dataCreditoSchema.create(dataCreditoBody);
    } catch (error) {
        console.error(error)
    } finally {
        await destroy();
    }
}

module.exports.updateOrCreate = async (dataCreditoUpdateBody) => {
    await connect();
    const result = await dataCreditoSchema.find({ "date.year": dataCreditoUpdateBody.date.year, "date.month": dataCreditoUpdateBody.date.month })
    if (result.length > 0) {
        await dataCreditoSchema.updateOne(
            { _id: result[0].id, user: result[0].user },
            {
                comportamiento: dataCreditoUpdateBody.comportamiento,
                score: dataCreditoUpdateBody.score,
                amountOfProducts: dataCreditoUpdateBody.amountOfProducts,
                arrears30daysLastYear: dataCreditoUpdateBody.arrears30days,
                arrears60daysLast2Year: dataCreditoUpdateBody.arrears60days,
                arrearsAmount: dataCreditoUpdateBody.arrearsAmount,
            }
        );

        await destroy();
    } else {
        console.log('create')
        await this.create(dataCreditoUpdateBody)
    }

}

module.exports.getdataCreditos = async (searchCriteria = {}) => {
    try {
        // This function open the mongo connection
        const user = await getUser(searchCriteria.user);
        if (!user) return {};
        const result = await dataCreditoSchema.findOne({
            user: user._id,
            ...searchCriteria.datacredit
        })
        await destroy();
        return result;
    } catch (e) {
        console.error(e);
        return {};
    }


}
