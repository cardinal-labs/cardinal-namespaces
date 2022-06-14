import { SES } from "aws-sdk";
import type { SendEmailRequest } from "aws-sdk/clients/ses";

const verificationSuccessfulEmail = (firstName: string, claimURL: string) => `
<div>
<img src="https://identity.cardinal.so/logos/empiredao-banner.png" alt="EmpireDAO" style="width: 100%;">
<p>
Hi ${firstName}, <br/><br/>

Thanks for filling out the EmpireDAO Soho Registration form. <br/><br/>

Next, claim your non-transferrable Registration NFT. Click <b><a href=${claimURL} target="_blank">here</a></b> to open a QR code and scan it with your hot wallet. <br/><br/>

Note that the only mobile wallets we currently support are <b>Phantom</b> and <b>Solflare</b>. <br/><br/>

At EmpireDAO, you will be asked to scan a QR code with the wallet holding this NFT, confirming registration by signing a message. <br/><br/>

Best,<br/>
EmpireDAO & Cardinal
</p>
</div>`;

export const sendEmail = (
  destination: string,
  firstName: string,
  claimURL: string
) => {
  const ses = new SES({
    apiVersion: "2010-12-01",
    region: "us-west-2",
    accessKeyId: process.env.SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
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
