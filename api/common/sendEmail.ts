import { SES } from "aws-sdk";
import type { SendEmailRequest } from "aws-sdk/clients/ses";

const verificationSuccessfulEmail = (firstName: string, claimURL: string) => `
<div>
<img src="https://identity.cardinal.so/logos/empiredao-registration-banner.png" alt="EmpireDAO" style="width: 100%; max-width: 1000px;">
<p>
Hi ${firstName}, <br/><br/>

Thanks for filling out the EmpireDAO Soho Registration form. You can now claim your non-transferrable Registration NFT. <br/><br/>

If you are on mobile, click <b><a href="https://phantom.app/ul/browse/${encodeURIComponent(
  claimURL
)}" target="_blank">here</a></b> to deep link to phantom. <br/><br/>

If you are on desktop, click <b><a href=${claimURL} target="_blank">here</a></b> to open a QR code and scan it with your hot wallet. <br/><br/>

Note that the only mobile wallet we currently support is <b>Phantom</b>. You don't need any SOL to claim the NFT! <br/><br/>

At EmpireDAO, you will be asked to scan a QR code with the wallet holding this NFT, and confirm your registration by signing a message. <br/><br/>

Best,<br/>
EmpireDAO & Cardinal
</p>
</div>`;

export const sendEmail = async (
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

  await ses.sendEmail(params).promise();
};
