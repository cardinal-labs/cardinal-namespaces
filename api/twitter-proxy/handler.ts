/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import fetch from "node-fetch";

import { TWITTER_API_KEYS } from "../twitter-claimer/utils";

module.exports.proxy = async (event) => {
  const params = event.queryStringParameters;
  const { _Host, _host, _Origin, _origin, ...headers } = event.headers;
  const responseHeaders = {
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
  };

  if (!params.url) {
    return {
      statusCode: 400,
      body: "Unable get url from 'url' query parameter",
    };
  }

  const requestParams = Object.entries(params)
    .reduce((acc, param) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (param[0] !== "url") acc.push(param.join("="));
      return acc;
    }, [])
    .join("&");

  if (!params.namespace || params.namespace === "twitter") {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const url = `${params.url}?${requestParams}`;
    const hasBody = /(POST|PUT)/i.test(event.httpMethod);
    for (let i = 0; i < TWITTER_API_KEYS.length; i++) {
      try {
        const res = await fetch(url, {
          method: event.httpMethod,
          timeout: 20000,
          body: hasBody ? event.body : null,
          headers: {
            ...headers,
            Authorization: `Bearer ${TWITTER_API_KEYS[i] || ""}`,
          },
        });
        console.log(
          `Got response from ${url} ---> {statusCode: ${res.status}}`
        );
        const body = await res.text();
        return {
          statusCode: res.status,
          headers: {
            ...responseHeaders,
            "content-type": res.headers["content-type"],
          },
          body,
        };
      } catch (e) {
        console.error(`Caught error: `, e);
        if (i === TWITTER_API_KEYS.length - 1) {
          return {
            statusCode: 400,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            body: JSON.stringify({ error: e.toString() }),
          };
        }
      }
    }
  } else if (params.namespace === "discord") {
    if (!params.initial) {
      return {
        statusCode: 400,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        body: JSON.stringify({ error: "No initial provided" }),
      };
    }
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        imageUri: `https://nft.cardinal.so/img/?text=${String(
          params.initial
        )}&proxy=true&cluster=mainnet-beta`,
      }),
    };
  } else {
    return {
      statusCode: 400,
      body: "Incorrect identity namespace",
    };
  }
};
