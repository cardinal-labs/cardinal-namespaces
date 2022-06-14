import { SES } from "aws-sdk";
import type { SendEmailRequest } from "aws-sdk/clients/ses";

const verificationSuccessfulEmail = (firstName: string, claimURL: string) => `
<p>
Hi ${firstName}, <br/><br/>

You’ve been successfully verified to access EmpireDAO Soho. <br/><br/>

Next, claim your non-transferrable Registration NFT to access the building. Note that the wallet you claim your NFT must be your mobile hot wallet — you will be scanning a QR code at the door to access the building. <br/><br/>

If you’re on a laptop, click <a href=${claimURL}>here</a> to open a QR code to scan from your hot wallet. <br/><br/>

If you’re on your phone, click this link to open your Solana wallet and claim your NFT directly. <br/><br/>

Best,
EmpireDAO & Cardinal
</p>`;

export const sendEmail = (
  destination: string,
  firstName: string,
  claimURL: string
) => {
  const ses = new SES({
    apiVersion: "2010-12-01",
    region: "us-west-2",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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
        Html: {
          Data: verificationSuccessfulEmail(firstName, claimURL),
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
