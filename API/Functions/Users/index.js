const UserRepo = require("./../../../shared/database/repos/user.repo");
const { encrypt, decrypt } = require('../../../shared/utils/crypto')

module.exports.getUserInformation = async (event) => {
  try {
    const {
      cognitoPoolClaims
    } = event

    const {
      sub
    } = cognitoPoolClaims

    const result = await UserRepo.getUser(
      {
        sub
      },
      { banks: true }
    );
    const UserInfo = result.length ? result[0] : null;
    if (UserInfo) UserInfo.settings = undefined;

    return {
      statusCode: "200",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(UserInfo),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: "500",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(error),
    };
  }
};

module.exports.addNewCategory = async (event) => {

  const body = event.body ? event.body : {};
  
  if (!body.label || !body.value)
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };

  const {
    cognitoPoolClaims
  } = event

  const {
    sub
  } = cognitoPoolClaims

  try {
    const result = await UserRepo.createCategory(
      {
        sub
      },
      { label: body.label, value: body.value }
    );
    return {
      statusCode: result ? 200 : 409,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: "500",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(error),
    };
  }
};

module.exports.checkSecretKey = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};

  if (!body.secretKey) return {
    statusCode: 400,
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  }

  const {
    cognitoPoolClaims
  } = event

  const {
    sub
  } = cognitoPoolClaims

  const user = await UserRepo.getUser({
    sub
  })

  if (!user.secretKey) return {
    statusCode: 409,
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  }

  const userKey = decrypt(user.secretKey)

  if (userKey !== body.secretKey) return {
    statusCode: 401,
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  }
}

module.exports.postConfirmation = async (event, context, callback) => {

  const { userName, request } = event
  const { userAttributes } = request
  const { sub, email_verified, phone_number, email } = userAttributes
  try {
    await UserRepo.create({
      name: userName,
      email,
      sub,
      phones: [
        phone_number
      ],
      verified: email_verified,
      emails: [
        email
      ]
    })
    callback(null, event)
  } catch (error) {
    callback(error, event)
  }

}