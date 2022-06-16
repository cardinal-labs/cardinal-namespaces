import fetch from "node-fetch";

export const TYPEFORM_NAMESPACE = "EmpireDAO";

const TYPEFORM_FORM_ID = process.env.TYPEFORM_ID || "";
const TYPEFORM_API_KEY = process.env.TYPEFORM_API_KEY || "";

export type TypeformResponse = {
  answers: {
    field: { id: string; ref: string; type: string };
    file_url?: string;
    text?: string;
    type: string;
  }[];
  token: string;
};

export const getTypeformResponse = async (
  entryName: string,
  formId = TYPEFORM_FORM_ID
): Promise<TypeformResponse | undefined> => {
  const response = await fetch(
    `https://api.typeform.com/forms/${formId}/responses?included_response_ids=${entryName}`,
    {
      headers: {
        Authorization: `bearer ${TYPEFORM_API_KEY}`,
      },
    }
  );
  const typeformResponse = (await response.json()) as {
    items: TypeformResponse[];
  };
  console.log(
    `Found ${
      typeformResponse.items && typeformResponse.items.length
    } responses for id ${entryName}`
  );
  return typeformResponse.items.find((r) => r.token === entryName);
};

export const getTypeformResponseBase64EncodedFile = async (
  fileUrl: string
): Promise<string> => {
  const response = await fetch(fileUrl, {
    headers: {
      Authorization: `bearer ${TYPEFORM_API_KEY}`,
    },
  });
  const buffer = await response.buffer();
  return buffer.toString("base64");
};
