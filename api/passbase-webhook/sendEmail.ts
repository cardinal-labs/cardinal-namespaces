import { SES } from "aws-sdk";
import type { SendEmailRequest } from "aws-sdk/clients/ses";

const verificationSuccessfulEmail = (firstName: string) => `
Hi ${firstName},

You’ve been successfully verified to access EmpireDAO Soho. 

Next, claim your non-transferrable Registration NFT to access the building. Please note: the wallet you claim your NFT must be your mobile hot wallet — you will be scanning a QR code at the door to access the building. 

If you’re on a laptop, you can either connect your hot wallet in your browser and claim the NFT here, or show a QR code that you can scan to claim your NFT here.

If you’re on your phone, click this link to open your Solana wallet and claim your NFT directly. 

Best,
EmpireDAO & Cardinal`;

export const sendEmail = (destination: string, firstName: string) => {
  const ses = new SES({
    apiVersion: "2010-12-01",
    // region: "us-west-2",
    accessKeyId: "",
    secretAccessKey: "",
  });

  const params: SendEmailRequest = {
    Source: "info@cardinal.so",
    Destination: {
      ToAddresses: [destination],
    },
    Message: {
      Subject: {
        Data: "You have been verified for EmpireDAO Soho",
      },
      Body: {
        Text: {
          Data: verificationSuccessfulEmail(firstName),
        },
      },
    },
  };

  const sendPromise = ses.sendEmail(params).promise();

  sendPromise
    .then(function (data) {
      console.log(data.MessageId);
    })
    .catch(function (err) {
      console.error(err);
    });
};
